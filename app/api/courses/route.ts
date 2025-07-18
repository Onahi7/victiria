import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { courses, courseModules, users } from '@/lib/db/schema'
import { desc, eq, and } from 'drizzle-orm'

// GET all courses
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const level = searchParams.get("level")
    const published = searchParams.get("published") !== "false"

    // Build where conditions
    const whereConditions = []
    
    if (published) {
      whereConditions.push(eq(courses.isPublished, true))
    }

    if (level && level !== "all") {
      whereConditions.push(eq(courses.level, level))
    }

    const whereClause = whereConditions.length > 0 ? and(...whereConditions) : undefined

    // Get courses with instructor info
    const allCourses = await db
      .select({
        id: courses.id,
        title: courses.title,
        description: courses.description,
        price: courses.price,
        thumbnailImage: courses.thumbnailImage,
        duration: courses.duration,
        level: courses.level,
        isPublished: courses.isPublished,
        createdAt: courses.createdAt,
        instructor: {
          id: users.id,
          name: users.name,
          avatar: users.avatar,
        }
      })
      .from(courses)
      .leftJoin(users, eq(courses.instructorId, users.id))
      .where(whereClause)
      .orderBy(desc(courses.createdAt))

    // Get module counts for each course
    const coursesWithModules = await Promise.all(
      allCourses.map(async (course) => {
        const moduleCount = await db
          .select({ count: courseModules.id })
          .from(courseModules)
          .where(eq(courseModules.courseId, course.id))

        return {
          ...course,
          moduleCount: moduleCount.length,
        }
      })
    )

    return NextResponse.json({
      success: true,
      data: coursesWithModules,
    })
  } catch (error) {
    console.error('Error fetching courses:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch courses' },
      { status: 500 }
    )
  }
}

const courseSchema = z.object({
  title: z.string().min(1, "Title is required").max(255, "Title too long"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  price: z.number().min(0, "Price must be positive"),
  thumbnailImage: z.string().url().optional(),
  duration: z.number().min(1, "Duration must be at least 1 minute"),
  level: z.enum(["beginner", "intermediate", "advanced"]),
  isPublished: z.boolean().default(false),
})

// POST create new course (admin/instructor only)
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session || !["ADMIN", "admin"].includes(session.user.role)) {
      return NextResponse.json(
        { success: false, error: "Unauthorized. Admin access required." },
        { status: 401 }
      )
    }

    const body = await request.json()
    const courseData = courseSchema.parse(body)

    const newCourse = await db.insert(courses).values({
      ...courseData,
      instructorId: session.user.id,
      createdAt: new Date(),
      updatedAt: new Date(),
    }).returning()

    return NextResponse.json({
      success: true,
      data: newCourse[0],
      message: "Course created successfully"
    }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: "Invalid input", details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error creating course:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create course' },
      { status: 500 }
    )
  }
}
