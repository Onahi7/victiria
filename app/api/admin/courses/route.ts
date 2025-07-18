import { NextRequest, NextResponse } from "next/server"
import { getAuthSession } from "@/lib/auth"
import { db } from "@/lib/db"
import { courses, courseModules, enrollments, courseReviews, users } from "@/lib/db/schema"
import { eq, desc, sql, count, and, ilike, or } from "drizzle-orm"

// GET /api/admin/courses - Get all courses with admin details
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
    const published = searchParams.get("published")
    const level = searchParams.get("level") || ""

    const offset = (page - 1) * limit

    // Build where conditions
    const whereConditions = []
    
    if (search) {
      whereConditions.push(
        or(
          ilike(courses.title, `%${search}%`),
          ilike(courses.description, `%${search}%`)
        )
      )
    }
    
    if (published !== null && published !== "") {
      whereConditions.push(eq(courses.isPublished, published === "true"))
    }
    
    if (level) {
      whereConditions.push(eq(courses.level, level))
    }

    const whereClause = whereConditions.length > 0 ? and(...whereConditions) : undefined

    // Get courses with additional details
    const coursesQuery = db
      .select({
        id: courses.id,
        title: courses.title,
        description: courses.description,
        price: courses.price,
        thumbnailImage: courses.thumbnailImage,
        instructorId: courses.instructorId,
        isPublished: courses.isPublished,
        duration: courses.duration,
        level: courses.level,
        createdAt: courses.createdAt,
        updatedAt: courses.updatedAt,
        instructor: {
          name: users.name,
          email: users.email
        },
        moduleCount: sql<number>`(
          SELECT COUNT(*) FROM ${courseModules} 
          WHERE ${courseModules.courseId} = ${courses.id}
        )`,
        enrollmentCount: sql<number>`(
          SELECT COUNT(*) FROM ${enrollments} 
          WHERE ${enrollments.courseId} = ${courses.id}
        )`,
        averageRating: sql<number>`(
          SELECT ROUND(AVG(${courseReviews.rating}), 1) 
          FROM ${courseReviews} 
          WHERE ${courseReviews.courseId} = ${courses.id}
        )`,
        reviewCount: sql<number>`(
          SELECT COUNT(*) FROM ${courseReviews} 
          WHERE ${courseReviews.courseId} = ${courses.id}
        )`,
        completionRate: sql<number>`(
          SELECT ROUND(
            COUNT(CASE WHEN ${enrollments.completedAt} IS NOT NULL THEN 1 END) * 100.0 / 
            NULLIF(COUNT(*), 0), 1
          )
          FROM ${enrollments} 
          WHERE ${enrollments.courseId} = ${courses.id}
        )`
      })
      .from(courses)
      .leftJoin(users, eq(courses.instructorId, users.id))

    if (whereClause) {
      coursesQuery.where(whereClause)
    }

    coursesQuery.orderBy(desc(courses.createdAt))

    const coursesList = await coursesQuery.limit(limit).offset(offset)

    // Get total count for pagination
    const totalCountQuery = db
      .select({ count: count() })
      .from(courses)

    if (whereClause) {
      totalCountQuery.where(whereClause)
    }

    const totalCount = await totalCountQuery
    const total = totalCount[0]?.count || 0

    return NextResponse.json({
      success: true,
      data: {
        courses: coursesList,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    })
  } catch (error) {
    console.error("Error fetching admin courses:", error)
    return NextResponse.json(
      { success: false, error: "Failed to fetch courses" },
      { status: 500 }
    )
  }
}

// POST /api/admin/courses - Create a new course
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
      description,
      price,
      thumbnailImage,
      instructorId,
      duration,
      level
    } = body

    const newCourse = await db.insert(courses).values({
      title,
      description,
      price: price.toString(),
      thumbnailImage,
      instructorId: instructorId || session.user.id,
      isPublished: false,
      duration,
      level
    }).returning()

    return NextResponse.json({
      success: true,
      data: newCourse[0],
      message: "Course created successfully"
    })
  } catch (error) {
    console.error("Error creating course:", error)
    return NextResponse.json(
      { success: false, error: "Failed to create course" },
      { status: 500 }
    )
  }
}

// PUT /api/admin/courses - Update course
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
        { success: false, error: "Course ID is required" },
        { status: 400 }
      )
    }

    let updateFields = { ...updateData }

    // Handle specific actions
    if (action) {
      switch (action) {
        case 'publish':
          updateFields = {
            isPublished: true
          }
          break
        case 'unpublish':
          updateFields = {
            isPublished: false
          }
          break
      }
    }

    updateFields.updatedAt = new Date()

    const updatedCourse = await db
      .update(courses)
      .set(updateFields)
      .where(eq(courses.id, id))
      .returning()

    if (updatedCourse.length === 0) {
      return NextResponse.json(
        { success: false, error: "Course not found" },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: updatedCourse[0],
      message: `Course ${action ? action + 'd' : 'updated'} successfully`
    })
  } catch (error) {
    console.error("Error updating course:", error)
    return NextResponse.json(
      { success: false, error: "Failed to update course" },
      { status: 500 }
    )
  }
}

// DELETE /api/admin/courses - Delete a course
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
        { success: false, error: "Course ID is required" },
        { status: 400 }
      )
    }

    // Check if course has enrollments
    const courseEnrollments = await db
      .select({ count: count() })
      .from(enrollments)
      .where(eq(enrollments.courseId, id))

    if (courseEnrollments[0]?.count > 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: "Cannot delete course with enrollments. Consider unpublishing instead." 
        },
        { status: 400 }
      )
    }

    const deletedCourse = await db
      .delete(courses)
      .where(eq(courses.id, id))
      .returning()

    if (deletedCourse.length === 0) {
      return NextResponse.json(
        { success: false, error: "Course not found" },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      message: "Course deleted successfully"
    })
  } catch (error) {
    console.error("Error deleting course:", error)
    return NextResponse.json(
      { success: false, error: "Failed to delete course" },
      { status: 500 }
    )
  }
}
