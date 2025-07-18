import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { courseReviews, enrollments, users } from '@/lib/db/schema'
import { eq, and, desc } from 'drizzle-orm'

interface RouteParams {
  params: {
    id: string
  }
}

// GET course reviews
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const courseId = params.id
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get("page") || "1")
    const limit = Math.min(parseInt(searchParams.get("limit") || "10"), 50)
    const skip = (page - 1) * limit

    // Get reviews with user information
    const reviews = await db
      .select({
        id: courseReviews.id,
        rating: courseReviews.rating,
        comment: courseReviews.comment,
        isVerifiedEnrollment: courseReviews.isVerifiedEnrollment,
        instructorReply: courseReviews.instructorReply,
        repliedAt: courseReviews.repliedAt,
        createdAt: courseReviews.createdAt,
        user: {
          id: users.id,
          name: users.name,
          avatar: users.avatar,
        }
      })
      .from(courseReviews)
      .leftJoin(users, eq(courseReviews.userId, users.id))
      .where(
        and(
          eq(courseReviews.courseId, courseId),
          eq(courseReviews.isPublished, true)
        )
      )
      .orderBy(desc(courseReviews.createdAt))
      .limit(limit)
      .offset(skip)

    // Get total count for pagination
    const totalResult = await db
      .select({ count: courseReviews.id })
      .from(courseReviews)
      .where(
        and(
          eq(courseReviews.courseId, courseId),
          eq(courseReviews.isPublished, true)
        )
      )

    // Calculate rating statistics
    const ratingStats = await db
      .select({
        rating: courseReviews.rating,
        count: courseReviews.id,
      })
      .from(courseReviews)
      .where(
        and(
          eq(courseReviews.courseId, courseId),
          eq(courseReviews.isPublished, true)
        )
      )

    // Process rating statistics
    const ratingCounts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
    let totalRating = 0
    let totalReviews = 0

    ratingStats.forEach(({ rating }) => {
      if (rating >= 1 && rating <= 5) {
        ratingCounts[rating as keyof typeof ratingCounts]++
        totalRating += rating
        totalReviews++
      }
    })

    const averageRating = totalReviews > 0 ? totalRating / totalReviews : 0

    return NextResponse.json({
      success: true,
      data: {
        reviews,
        pagination: {
          page,
          limit,
          total: totalResult.length,
          totalPages: Math.ceil(totalResult.length / limit),
          hasNextPage: page < Math.ceil(totalResult.length / limit),
          hasPrevPage: page > 1,
        },
        statistics: {
          averageRating: Math.round(averageRating * 10) / 10,
          totalReviews,
          ratingCounts,
        }
      }
    })
  } catch (error) {
    console.error('Error fetching course reviews:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch reviews' },
      { status: 500 }
    )
  }
}

const reviewSchema = z.object({
  rating: z.number().min(1, "Rating must be at least 1").max(5, "Rating cannot exceed 5"),
  comment: z.string().min(10, "Comment must be at least 10 characters").max(1000, "Comment too long").optional(),
})

// POST create review
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth()
    
    if (!session) {
      return NextResponse.json(
        { success: false, error: "Authentication required" },
        { status: 401 }
      )
    }

    const courseId = params.id
    const body = await request.json()
    const { rating, comment } = reviewSchema.parse(body)

    // Check if user is enrolled in the course
    const enrollment = await db
      .select()
      .from(enrollments)
      .where(
        and(
          eq(enrollments.userId, session.user.id),
          eq(enrollments.courseId, courseId)
        )
      )
      .limit(1)

    if (!enrollment.length) {
      return NextResponse.json(
        { success: false, error: "You must be enrolled in this course to leave a review" },
        { status: 403 }
      )
    }

    // Check if user has already reviewed this course
    const existingReview = await db
      .select()
      .from(courseReviews)
      .where(
        and(
          eq(courseReviews.userId, session.user.id),
          eq(courseReviews.courseId, courseId)
        )
      )
      .limit(1)

    if (existingReview.length > 0) {
      return NextResponse.json(
        { success: false, error: "You have already reviewed this course" },
        { status: 400 }
      )
    }

    // Create review
    const review = await db.insert(courseReviews).values({
      userId: session.user.id,
      courseId,
      rating,
      comment: comment || null,
      isVerifiedEnrollment: true,
      isPublished: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    }).returning()

    // Get user info for response
    const userInfo = await db
      .select({
        id: users.id,
        name: users.name,
        avatar: users.avatar,
      })
      .from(users)
      .where(eq(users.id, session.user.id))
      .limit(1)

    return NextResponse.json({
      success: true,
      data: {
        ...review[0],
        user: userInfo[0],
      },
      message: "Review submitted successfully"
    }, { status: 201 })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: "Invalid input", details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error creating review:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to submit review' },
      { status: 500 }
    )
  }
}
