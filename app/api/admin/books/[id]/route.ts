import { NextRequest, NextResponse } from "next/server"
import { getAuthSession } from "@/lib/auth"
import { db } from "@/lib/db"
import { books, users, reviews, orderItems, orders } from "@/lib/db/schema"
import { eq, desc, sql, count, and } from "drizzle-orm"

// GET /api/admin/books/[id] - Get a specific book with admin details
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getAuthSession()
    
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      )
    }

    const bookId = params.id

    // Get book with additional admin details
    const bookData = await db
      .select({
        id: books.id,
        title: books.title,
        author: books.author,
        authorId: books.authorId,
        description: books.description,
        excerpt: books.excerpt,
        price: books.price,
        priceUsd: books.priceUsd,
        priceNgn: books.priceNgn,
        coverImage: books.coverImage,
        frontCoverImage: books.frontCoverImage,
        backCoverImage: books.backCoverImage,
        status: books.status,
        category: books.category,
        tags: books.tags,
        stock: books.stock,
        isAvailable: books.isAvailable,
        digitalDownload: books.digitalDownload,
        bookFile: books.bookFile,
        isbn: books.isbn,
        pageCount: books.pageCount,
        language: books.language,
        salesCount: books.salesCount,
        totalRevenue: books.totalRevenue,
        authorRevenue: books.authorRevenue,
        royaltyRate: books.royaltyRate,
        publishedAt: books.publishedAt,
        createdAt: books.createdAt,
        updatedAt: books.updatedAt,
        reviewedAt: books.reviewedAt,
        reviewedBy: books.reviewedBy,
        reviewNotes: books.reviewNotes,
        authorUser: {
          name: users.name,
          email: users.email
        },
        reviewCount: sql<number>`(
          SELECT COUNT(*) FROM ${reviews} WHERE ${reviews.bookId} = ${books.id}
        )`,
        averageRating: sql<number>`(
          SELECT ROUND(AVG(${reviews.rating}), 1) FROM ${reviews} WHERE ${reviews.bookId} = ${books.id}
        )`,
        orderCount: sql<number>`(
          SELECT COUNT(*) FROM ${orderItems} 
          INNER JOIN ${orders} ON ${orderItems.orderId} = ${orders.id}
          WHERE ${orderItems.bookId} = ${books.id} AND ${orders.paymentStatus} = 'completed'
        )`
      })
      .from(books)
      .leftJoin(users, eq(books.authorId, users.id))
      .where(eq(books.id, bookId))

    if (bookData.length === 0) {
      return NextResponse.json(
        { success: false, error: "Book not found" },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: bookData[0]
    })
  } catch (error) {
    console.error("Error fetching book:", error)
    return NextResponse.json(
      { success: false, error: "Failed to fetch book" },
      { status: 500 }
    )
  }
}

// PUT /api/admin/books/[id] - Update a specific book
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getAuthSession()
    
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      )
    }

    const bookId = params.id
    const body = await request.json()
    const { action, ...updateData } = body

    // First check if book exists
    const existingBook = await db
      .select({ id: books.id })
      .from(books)
      .where(eq(books.id, bookId))

    if (existingBook.length === 0) {
      return NextResponse.json(
        { success: false, error: "Book not found" },
        { status: 404 }
      )
    }

    let updateFields = { ...updateData }

    // Handle specific actions
    if (action) {
      switch (action) {
        case 'publish':
          updateFields = {
            ...updateFields,
            status: 'published',
            publishedAt: new Date(),
            isAvailable: true
          }
          break
        case 'unpublish':
          updateFields = {
            ...updateFields,
            status: 'draft',
            isAvailable: false
          }
          break
        case 'approve':
          updateFields = {
            ...updateFields,
            status: 'approved',
            reviewedAt: new Date(),
            reviewedBy: session.user.id
          }
          break
        case 'reject':
          updateFields = {
            ...updateFields,
            status: 'rejected',
            reviewedAt: new Date(),
            reviewedBy: session.user.id,
            reviewNotes: updateData.rejectionReason || 'Rejected by admin'
          }
          break
        case 'archive':
          updateFields = {
            ...updateFields,
            status: 'archived',
            isAvailable: false
          }
          break
      }
    }

    // Handle dual currency pricing - ensure proper data types
    if (updateFields.priceUsd !== undefined) {
      updateFields.priceUsd = updateFields.priceUsd ? parseFloat(updateFields.priceUsd.toString()) : null
    }
    if (updateFields.priceNgn !== undefined) {
      updateFields.priceNgn = updateFields.priceNgn ? parseFloat(updateFields.priceNgn.toString()) : null
    }

    // Ensure at least one price is set if updating pricing
    if ((updateFields.priceUsd !== undefined || updateFields.priceNgn !== undefined)) {
      const finalPriceUsd = updateFields.priceUsd !== undefined ? updateFields.priceUsd : null
      const finalPriceNgn = updateFields.priceNgn !== undefined ? updateFields.priceNgn : null
      
      if (!finalPriceUsd && !finalPriceNgn) {
        return NextResponse.json(
          { success: false, error: "At least one price (USD or NGN) must be set" },
          { status: 400 }
        )
      }
    }

    // Update timestamp
    updateFields.updatedAt = new Date()

    // Remove undefined values to prevent database errors
    Object.keys(updateFields).forEach(key => {
      if (updateFields[key] === undefined) {
        delete updateFields[key]
      }
    })

    const updatedBook = await db
      .update(books)
      .set(updateFields)
      .where(eq(books.id, bookId))
      .returning()

    return NextResponse.json({
      success: true,
      data: updatedBook[0],
      message: `Book ${action ? action + 'd' : 'updated'} successfully`
    })
  } catch (error) {
    console.error("Error updating book:", error)
    return NextResponse.json(
      { success: false, error: "Failed to update book" },
      { status: 500 }
    )
  }
}

// DELETE /api/admin/books/[id] - Delete a specific book
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getAuthSession()
    
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      )
    }

    const bookId = params.id

    // Check if book exists
    const existingBook = await db
      .select({ id: books.id })
      .from(books)
      .where(eq(books.id, bookId))

    if (existingBook.length === 0) {
      return NextResponse.json(
        { success: false, error: "Book not found" },
        { status: 404 }
      )
    }

    // Check if book has orders (prevent deletion if it has sales)
    const bookOrders = await db
      .select({ count: count() })
      .from(orderItems)
      .innerJoin(orders, eq(orderItems.orderId, orders.id))
      .where(and(
        eq(orderItems.bookId, bookId),
        eq(orders.paymentStatus, 'completed')
      ))

    if (bookOrders[0]?.count > 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: "Cannot delete book with completed orders. Consider archiving instead." 
        },
        { status: 400 }
      )
    }

    const deletedBook = await db
      .delete(books)
      .where(eq(books.id, bookId))
      .returning()

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
