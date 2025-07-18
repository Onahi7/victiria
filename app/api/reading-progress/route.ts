import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { readingProgress, books, orders } from "@/lib/db/schema"
import { eq, and, desc } from "drizzle-orm"

const updateProgressSchema = z.object({
  bookId: z.string().min(1, "Book ID is required"),
  currentPage: z.number().min(0).optional(),
  totalPages: z.number().min(1).optional(),
  percentage: z.number().min(0).max(100).optional(),
  notes: z.string().optional(),
  isCompleted: z.boolean().optional(),
})

// GET /api/reading-progress - Get user's reading progress
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const bookId = searchParams.get("bookId")
    const status = searchParams.get("status") // 'reading', 'completed', 'all'

    let query = db
      .select({
        id: readingProgress.id,
        currentPage: readingProgress.currentPage,
        totalPages: readingProgress.totalPages,
        percentage: readingProgress.percentage,
        lastReadAt: readingProgress.lastReadAt,
        isCompleted: readingProgress.isCompleted,
        completedAt: readingProgress.completedAt,
        notes: readingProgress.notes,
        createdAt: readingProgress.createdAt,
        updatedAt: readingProgress.updatedAt,
        book: {
          id: books.id,
          title: books.title,
          author: books.author,
          coverImage: books.coverImage,
          price: books.price,
        }
      })
      .from(readingProgress)
      .innerJoin(books, eq(readingProgress.bookId, books.id))
      .where(eq(readingProgress.userId, session.user.id))

    // Filter by specific book
    if (bookId) {
      query = query.where(and(
        eq(readingProgress.userId, session.user.id),
        eq(readingProgress.bookId, bookId)
      ))
    }

    // Filter by status
    if (status === "completed") {
      query = query.where(and(
        eq(readingProgress.userId, session.user.id),
        eq(readingProgress.isCompleted, true)
      ))
    } else if (status === "reading") {
      query = query.where(and(
        eq(readingProgress.userId, session.user.id),
        eq(readingProgress.isCompleted, false)
      ))
    }

    const progressList = await query.orderBy(desc(readingProgress.lastReadAt))

    // If looking for a specific book, return single object
    if (bookId && progressList.length > 0) {
      return NextResponse.json({
        success: true,
        data: progressList[0]
      })
    }

    return NextResponse.json({
      success: true,
      data: {
        progress: progressList,
        count: progressList.length,
        summary: {
          totalBooks: progressList.length,
          completedBooks: progressList.filter(p => p.isCompleted).length,
          currentlyReading: progressList.filter(p => !p.isCompleted).length,
        }
      }
    })
  } catch (error) {
    console.error("Error fetching reading progress:", error)
    return NextResponse.json(
      { success: false, error: "Failed to fetch reading progress" },
      { status: 500 }
    )
  }
}

// POST /api/reading-progress - Update reading progress
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { bookId, currentPage, totalPages, percentage, notes, isCompleted } = updateProgressSchema.parse(body)

    // Verify user has access to this book (has purchased it)
    const purchase = await db
      .select()
      .from(orders)
      .where(and(
        eq(orders.userId, session.user.id),
        eq(orders.bookId, bookId),
        eq(orders.status, "delivered")
      ))
      .limit(1)

    if (!purchase[0]) {
      return NextResponse.json(
        { success: false, error: "You don't have access to this book" },
        { status: 403 }
      )
    }

    // Calculate percentage if not provided but pages are
    let calculatedPercentage = percentage
    if (!calculatedPercentage && currentPage && totalPages && totalPages > 0) {
      calculatedPercentage = Math.round((currentPage / totalPages) * 100)
    }

    // Check if progress record exists
    const existingProgress = await db
      .select()
      .from(readingProgress)
      .where(and(
        eq(readingProgress.userId, session.user.id),
        eq(readingProgress.bookId, bookId)
      ))
      .limit(1)

    let result

    if (existingProgress[0]) {
      // Update existing progress
      const updateData: any = {
        lastReadAt: new Date(),
        updatedAt: new Date(),
      }

      if (currentPage !== undefined) updateData.currentPage = currentPage
      if (totalPages !== undefined) updateData.totalPages = totalPages
      if (calculatedPercentage !== undefined) updateData.percentage = calculatedPercentage
      if (notes !== undefined) updateData.notes = notes
      if (isCompleted !== undefined) {
        updateData.isCompleted = isCompleted
        if (isCompleted) {
          updateData.completedAt = new Date()
          updateData.percentage = 100
        } else {
          updateData.completedAt = null
        }
      }

      result = await db
        .update(readingProgress)
        .set(updateData)
        .where(eq(readingProgress.id, existingProgress[0].id))
        .returning()
    } else {
      // Create new progress record
      result = await db
        .insert(readingProgress)
        .values({
          userId: session.user.id,
          bookId,
          currentPage: currentPage || 0,
          totalPages,
          percentage: calculatedPercentage || 0,
          notes,
          isCompleted: isCompleted || false,
          completedAt: isCompleted ? new Date() : null,
        })
        .returning()
    }

    return NextResponse.json({
      success: true,
      data: result[0],
      message: "Reading progress updated successfully"
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: "Invalid input", details: error.errors },
        { status: 400 }
      )
    }

    console.error("Error updating reading progress:", error)
    return NextResponse.json(
      { success: false, error: "Failed to update reading progress" },
      { status: 500 }
    )
  }
}

// DELETE /api/reading-progress - Remove reading progress
export async function DELETE(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const bookId = searchParams.get("bookId")

    if (!bookId) {
      return NextResponse.json(
        { success: false, error: "Book ID is required" },
        { status: 400 }
      )
    }

    // Check if progress exists
    const existingProgress = await db
      .select()
      .from(readingProgress)
      .where(and(
        eq(readingProgress.userId, session.user.id),
        eq(readingProgress.bookId, bookId)
      ))
      .limit(1)

    if (!existingProgress[0]) {
      return NextResponse.json(
        { success: false, error: "Reading progress not found" },
        { status: 404 }
      )
    }

    // Delete progress
    await db
      .delete(readingProgress)
      .where(and(
        eq(readingProgress.userId, session.user.id),
        eq(readingProgress.bookId, bookId)
      ))

    return NextResponse.json({
      success: true,
      message: "Reading progress removed successfully"
    })
  } catch (error) {
    console.error("Error removing reading progress:", error)
    return NextResponse.json(
      { success: false, error: "Failed to remove reading progress" },
      { status: 500 }
    )
  }
}
