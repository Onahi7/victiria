import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { reviews, books, users, orders } from "@/lib/db/schema"
import { eq, and, desc, sql, avg } from "drizzle-orm"

const createReviewSchema = z.object({
  bookId: z.string().min(1, "Book ID is required"),
  rating: z.number().min(1).max(5, "Rating must be between 1 and 5"),
  comment: z.string().optional(),
})

const updateReviewSchema = z.object({
  rating: z.number().min(1).max(5, "Rating must be between 1 and 5").optional(),
  comment: z.string().optional(),
})

// GET /api/reviews - Get reviews (with filtering)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const bookId = searchParams.get("bookId")
    const userId = searchParams.get("userId")
    const limit = parseInt(searchParams.get("limit") || "10")
    const offset = parseInt(searchParams.get("offset") || "0")

    let query = db
      .select({
        id: reviews.id,
        rating: reviews.rating,
        comment: reviews.comment,
        isVerifiedPurchase: reviews.isVerifiedPurchase,
        createdAt: reviews.createdAt,
        updatedAt: reviews.updatedAt,
        user: {
          id: users.id,
          name: users.name,
          avatar: users.avatar,
        },
        book: bookId ? undefined : {
          id: books.id,
          title: books.title,
          coverImage: books.coverImage,
        }
      })
      .from(reviews)
      .innerJoin(users, eq(reviews.userId, users.id))

    if (!bookId) {
      query = query.innerJoin(books, eq(reviews.bookId, books.id))
    }

    // Build where conditions
    const conditions = [eq(reviews.isPublished, true)]
    
    if (bookId) {
      conditions.push(eq(reviews.bookId, bookId))
    }
    
    if (userId) {
      conditions.push(eq(reviews.userId, userId))
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions))
    }

    const reviewsList = await query
      .orderBy(desc(reviews.createdAt))
      .limit(limit)
      .offset(offset)

    // Get review statistics for the book if bookId is provided
    let statistics = null
    if (bookId) {
      const stats = await db
        .select({
          totalReviews: sql<number>`COUNT(*)`,
          averageRating: sql<number>`ROUND(AVG(${reviews.rating}), 1)`,
          ratingDistribution: sql<any>`
            JSON_BUILD_OBJECT(
              '5', COUNT(CASE WHEN ${reviews.rating} = 5 THEN 1 END),
              '4', COUNT(CASE WHEN ${reviews.rating} = 4 THEN 1 END),
              '3', COUNT(CASE WHEN ${reviews.rating} = 3 THEN 1 END),
              '2', COUNT(CASE WHEN ${reviews.rating} = 2 THEN 1 END),
              '1', COUNT(CASE WHEN ${reviews.rating} = 1 THEN 1 END)
            )
          `
        })
        .from(reviews)
        .where(and(
          eq(reviews.bookId, bookId),
          eq(reviews.isPublished, true)
        ))

      statistics = stats[0] || {
        totalReviews: 0,
        averageRating: 0,
        ratingDistribution: { '5': 0, '4': 0, '3': 0, '2': 0, '1': 0 }
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        reviews: reviewsList,
        statistics,
        pagination: {
          limit,
          offset,
          hasMore: reviewsList.length === limit
        }
      }
    })
  } catch (error) {
    console.error("Error fetching reviews:", error)
    return NextResponse.json(
      { success: false, error: "Failed to fetch reviews" },
      { status: 500 }
    )
  }
}

// POST /api/reviews - Create new review
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
    const { bookId, rating, comment } = createReviewSchema.parse(body)

    // Check if book exists
    const book = await db
      .select()
      .from(books)
      .where(eq(books.id, bookId))
      .limit(1)

    if (!book[0]) {
      return NextResponse.json(
        { success: false, error: "Book not found" },
        { status: 404 }
      )
    }

    // Check if user already reviewed this book
    const existingReview = await db
      .select()
      .from(reviews)
      .where(and(
        eq(reviews.userId, session.user.id),
        eq(reviews.bookId, bookId)
      ))
      .limit(1)

    if (existingReview[0]) {
      return NextResponse.json(
        { success: false, error: "You have already reviewed this book" },
        { status: 400 }
      )
    }

    // Check if user has purchased this book (for verified purchase flag)
    const purchase = await db
      .select()
      .from(orders)
      .where(and(
        eq(orders.userId, session.user.id),
        eq(orders.bookId, bookId),
        eq(orders.status, "delivered")
      ))
      .limit(1)

    const isVerifiedPurchase = !!purchase[0]

    // Create review
    const newReview = await db
      .insert(reviews)
      .values({
        userId: session.user.id,
        bookId,
        rating,
        comment,
        isVerifiedPurchase,
      })
      .returning()

    return NextResponse.json({
      success: true,
      data: newReview[0],
      message: "Review created successfully"
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: "Invalid input", details: error.errors },
        { status: 400 }
      )
    }

    console.error("Error creating review:", error)
    return NextResponse.json(
      { success: false, error: "Failed to create review" },
      { status: 500 }
    )
  }
}

// PUT /api/reviews - Update existing review
export async function PUT(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const reviewId = searchParams.get("reviewId")

    if (!reviewId) {
      return NextResponse.json(
        { success: false, error: "Review ID is required" },
        { status: 400 }
      )
    }

    const body = await request.json()
    const updateData = updateReviewSchema.parse(body)

    // Check if review exists and belongs to user
    const existingReview = await db
      .select()
      .from(reviews)
      .where(and(
        eq(reviews.id, reviewId),
        eq(reviews.userId, session.user.id)
      ))
      .limit(1)

    if (!existingReview[0]) {
      return NextResponse.json(
        { success: false, error: "Review not found or unauthorized" },
        { status: 404 }
      )
    }

    // Update review
    const updatedReview = await db
      .update(reviews)
      .set({
        ...updateData,
        updatedAt: new Date(),
      })
      .where(eq(reviews.id, reviewId))
      .returning()

    return NextResponse.json({
      success: true,
      data: updatedReview[0],
      message: "Review updated successfully"
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: "Invalid input", details: error.errors },
        { status: 400 }
      )
    }

    console.error("Error updating review:", error)
    return NextResponse.json(
      { success: false, error: "Failed to update review" },
      { status: 500 }
    )
  }
}

// DELETE /api/reviews - Delete review
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
    const reviewId = searchParams.get("reviewId")

    if (!reviewId) {
      return NextResponse.json(
        { success: false, error: "Review ID is required" },
        { status: 400 }
      )
    }

    // Check if review exists and belongs to user (or user is admin)
    const conditions = [eq(reviews.id, reviewId)]
    if (session.user.role !== "admin") {
      conditions.push(eq(reviews.userId, session.user.id))
    }

    const existingReview = await db
      .select()
      .from(reviews)
      .where(and(...conditions))
      .limit(1)

    if (!existingReview[0]) {
      return NextResponse.json(
        { success: false, error: "Review not found or unauthorized" },
        { status: 404 }
      )
    }

    // Delete review
    await db
      .delete(reviews)
      .where(eq(reviews.id, reviewId))

    return NextResponse.json({
      success: true,
      message: "Review deleted successfully"
    })
  } catch (error) {
    console.error("Error deleting review:", error)
    return NextResponse.json(
      { success: false, error: "Failed to delete review" },
      { status: 500 }
    )
  }
}
