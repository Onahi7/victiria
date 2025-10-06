import { NextRequest, NextResponse } from "next/server"
import { getAuthSession } from "@/lib/auth"
import { db } from "@/lib/db"
import { books, users, reviews, orderItems, orders } from "@/lib/db/schema"
import { eq, desc, sql, count, and, ilike, or } from "drizzle-orm"

// GET /api/admin/books - Get all books with admin details
export async function GET(request: NextRequest) {
  try {
    const session = await getAuthSession()
    
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "10")
    const search = searchParams.get("search") || ""
    const status = searchParams.get("status") || ""
    const category = searchParams.get("category") || ""
    const sortBy = searchParams.get("sortBy") || "createdAt"
    const sortOrder = searchParams.get("sortOrder") || "desc"

    const offset = (page - 1) * limit

    // Build where conditions
    const whereConditions = []
    
    if (search) {
      whereConditions.push(
        or(
          ilike(books.title, `%${search}%`),
          ilike(books.author, `%${search}%`),
          ilike(books.description, `%${search}%`)
        )
      )
    }
    
    if (status && ['draft', 'pending_review', 'approved', 'published', 'rejected', 'archived'].includes(status)) {
      whereConditions.push(eq(books.status, status as 'draft' | 'pending_review' | 'approved' | 'published' | 'rejected' | 'archived'))
    }
    
    if (category) {
      whereConditions.push(eq(books.category, category))
    }

    const whereClause = whereConditions.length > 0 ? and(...whereConditions) : undefined

    // Get books with additional admin details
    const booksQuery = db
      .select({
        id: books.id,
        title: books.title,
        author: books.author,
        authorId: books.authorId,
        description: books.description,
        price: books.price,
        coverImage: books.coverImage,
        status: books.status,
        category: books.category,
        tags: books.tags,
        stock: books.stock,
        isAvailable: books.isAvailable,
        salesCount: books.salesCount,
        totalRevenue: books.totalRevenue,
        authorRevenue: books.authorRevenue,
        royaltyRate: books.royaltyRate,
        publishedAt: books.publishedAt,
        createdAt: books.createdAt,
        updatedAt: books.updatedAt,
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

    if (whereClause) {
      booksQuery.where(whereClause)
    }

    // Apply sorting
    const sortColumn = sortBy === "title" ? books.title :
                      sortBy === "author" ? books.author :
                      sortBy === "price" ? books.price :
                      sortBy === "salesCount" ? books.salesCount :
                      sortBy === "status" ? books.status :
                      books.createdAt

    if (sortOrder === "desc") {
      booksQuery.orderBy(desc(sortColumn))
    } else {
      booksQuery.orderBy(sortColumn)
    }

    const booksList = await booksQuery.limit(limit).offset(offset)

    // Get total count for pagination
    const totalCountQuery = db
      .select({ count: count() })
      .from(books)

    if (whereClause) {
      totalCountQuery.where(whereClause)
    }

    const totalCount = await totalCountQuery
    const total = totalCount[0]?.count || 0

    return NextResponse.json({
      success: true,
      data: {
        books: booksList,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    })
  } catch (error) {
    console.error("Error fetching admin books:", error)
    return NextResponse.json(
      { success: false, error: "Failed to fetch books" },
      { status: 500 }
    )
  }
}

// POST /api/admin/books - Create a new book (admin only)
export async function POST(request: NextRequest) {
  try {
    const session = await getAuthSession()
    
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      )
    }

    const body = await request.json()
    const {
      title,
      author,
      authorId,
      description,
      excerpt,
      price,
      priceUsd,
      priceNgn,
      coverImage,
      category,
      tags,
      stock,
      digitalDownload,
      bookFile,
      isbn,
      pageCount,
      language,
      royaltyRate,
      isFree
    } = body

    // Generate slug from title
    const generateSlug = (title: string): string => {
      return title
        .toLowerCase()
        .replace(/[^a-z0-9 -]/g, '') // Remove special characters
        .replace(/\s+/g, '-') // Replace spaces with hyphens
        .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
        .replace(/^-+|-+$/g, '') // Remove leading/trailing hyphens
        .trim()
    }

    let slug = generateSlug(title)
    
    // Ensure slug is unique
    let slugCounter = 0
    const originalSlug = slug
    while (true) {
      const existingSlugBook = await db
        .select()
        .from(books)
        .where(eq(books.slug, slug))
        .limit(1)
      
      if (existingSlugBook.length === 0) break
      
      slugCounter++
      slug = `${originalSlug}-${slugCounter}`
    }

    const newBook = await db.insert(books).values({
      title,
      author,
      authorId: authorId || null,
      description,
      excerpt,
      price: price?.toString() || '0.00', // Legacy field
      priceUsd: priceUsd !== null ? priceUsd.toString() : null, // USD price if provided
      priceNgn: priceNgn !== null ? priceNgn.toString() : null, // NGN price if provided
      coverImage,
      status: 'published',
      category,
      tags: tags || [],
      stock: stock || 0,
      isAvailable: true,
      isFree: isFree || false,
      digitalDownload,
      bookFile,
      isbn,
      pageCount,
      language: language || 'English',
      royaltyRate: royaltyRate ? royaltyRate.toString() : '70.00',
      slug: slug, // Add the generated slug
      publishedAt: new Date(),
      salesCount: 0,
      totalRevenue: '0.00',
      authorRevenue: '0.00',
      createdAt: new Date(),
      updatedAt: new Date()
    }).returning()

    return NextResponse.json({
      success: true,
      data: newBook[0],
      message: "Book created successfully"
    })
  } catch (error) {
    console.error("Error creating book:", error)
    return NextResponse.json(
      { success: false, error: "Failed to create book" },
      { status: 500 }
    )
  }
}

// PUT /api/admin/books - Update book status or details
export async function PUT(request: NextRequest) {
  try {
    const session = await getAuthSession()
    
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { id, action, ...updateData } = body

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Book ID is required" },
        { status: 400 }
      )
    }

    let updateFields = { ...updateData }

    // Handle specific actions
    if (action) {
      switch (action) {
        case 'publish':
          updateFields = {
            status: 'published',
            publishedAt: new Date(),
            isAvailable: true
          }
          break
        case 'unpublish':
          updateFields = {
            status: 'draft',
            isAvailable: false
          }
          break
        case 'approve':
          updateFields = {
            status: 'approved',
            reviewedAt: new Date(),
            reviewedBy: session.user.id
          }
          break
        case 'reject':
          updateFields = {
            status: 'rejected',
            reviewedAt: new Date(),
            reviewedBy: session.user.id,
            reviewNotes: updateData.rejectionReason || 'Rejected by admin'
          }
          break
        case 'archive':
          updateFields = {
            status: 'archived',
            isAvailable: false
          }
          break
      }
    }

    // Update timestamp
    updateFields.updatedAt = new Date()

    const updatedBook = await db
      .update(books)
      .set(updateFields)
      .where(eq(books.id, id))
      .returning()

    if (updatedBook.length === 0) {
      return NextResponse.json(
        { success: false, error: "Book not found" },
        { status: 404 }
      )
    }

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

// DELETE /api/admin/books - Delete a book
export async function DELETE(request: NextRequest) {
  try {
    const session = await getAuthSession()
    
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Book ID is required" },
        { status: 400 }
      )
    }

    // Check if book has orders (prevent deletion if it has sales)
    const bookOrders = await db
      .select({ count: count() })
      .from(orderItems)
      .innerJoin(orders, eq(orderItems.orderId, orders.id))
      .where(and(
        eq(orderItems.bookId, id),
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
      .where(eq(books.id, id))
      .returning()

    if (deletedBook.length === 0) {
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
