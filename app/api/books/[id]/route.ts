import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { books } from "@/lib/db/schema"
import { eq } from "drizzle-orm"

const updateBookSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().min(1).optional(),
  price: z.number().min(0).optional(),
  coverImage: z.string().url().optional(),
  category: z.string().min(1).optional(),
  status: z.enum(["draft", "published", "archived"]).optional(),
})

// GET /api/books/[id] - Get single book
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const book = await db.select()
      .from(books)
      .where(eq(books.id, id))
      .limit(1)

    if (!book.length) {
      return NextResponse.json(
        { success: false, error: "Book not found" },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: book[0]
    })
  } catch (error) {
    console.error("Error fetching book:", error)
    return NextResponse.json(
      { success: false, error: "Failed to fetch book" },
      { status: 500 }
    )
  }
}

// PUT /api/books/[id] - Update book (admin only)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    
    if (!session || session.user.role !== "admin") {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      )
    }

    const { id } = await params
    const body = await request.json()
    const bookData = updateBookSchema.parse(body)

    const updatedBook = await db.update(books)
      .set({
        ...bookData,
        updatedAt: new Date(),
      })
      .where(eq(books.id, id))
      .returning()

    if (!updatedBook.length) {
      return NextResponse.json(
        { success: false, error: "Book not found" },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: updatedBook[0]
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: "Invalid input", details: error.errors },
        { status: 400 }
      )
    }

    console.error("Error updating book:", error)
    return NextResponse.json(
      { success: false, error: "Failed to update book" },
      { status: 500 }
    )
  }
}

// DELETE /api/books/[id] - Delete book (admin only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    
    if (!session || session.user.role !== "admin") {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      )
    }

    const { id } = await params
    const deletedBook = await db.delete(books)
      .where(eq(books.id, id))
      .returning()

    if (!deletedBook.length) {
      return NextResponse.json(
        { success: false, error: "Book not found" },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      message: "Book deleted successfully"
    })
  } catch (error) {
    console.error("Error deleting book:", error)
    return NextResponse.json(
      { success: false, error: "Failed to delete book" },
      { status: 500 }
    )
  }
}
