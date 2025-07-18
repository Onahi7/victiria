import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { courses, courseModules, enrollments, users } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'

interface RouteParams {
  params: {
    id: string
  }
}

// GET individual course with modules
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth()
    const courseId = params.id

    // Get course with instructor info
    const courseResult = await db
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
          bio: users.bio,
        }
      })
      .from(courses)
      .leftJoin(users, eq(courses.instructorId, users.id))
      .where(eq(courses.id, courseId))
      .limit(1)

    if (!courseResult.length) {
      return NextResponse.json(
        { success: false, error: 'Course not found' },
        { status: 404 }
      )
    }

    const course = courseResult[0]

    // Check if user is enrolled
    let isEnrolled = false
    let enrollment = null
    
    if (session) {
      const enrollmentResult = await db
        .select()
        .from(enrollments)
        .where(
          and(
            eq(enrollments.userId, session.user.id),
            eq(enrollments.courseId, courseId)
          )
        )
        .limit(1)

      if (enrollmentResult.length > 0) {
        isEnrolled = true
        enrollment = enrollmentResult[0]
      }
    }

    // Get course modules (show preview modules or all if enrolled)
    const moduleConditions = [eq(courseModules.courseId, courseId)]
    
    if (!isEnrolled) {
      moduleConditions.push(eq(courseModules.isPreview, true))
    }

    const modules = await db
      .select({
        id: courseModules.id,
        title: courseModules.title,
        content: courseModules.content,
        videoUrl: courseModules.videoUrl,
        duration: courseModules.duration,
        order: courseModules.order,
        isPreview: courseModules.isPreview,
      })
      .from(courseModules)
      .where(and(...moduleConditions))
      .orderBy(courseModules.order)

    // Get total module count
    const totalModulesResult = await db
      .select({ count: courseModules.id })
      .from(courseModules)
      .where(eq(courseModules.courseId, courseId))

    return NextResponse.json({
      success: true,
      data: {
        ...course,
        modules,
        totalModules: totalModulesResult.length,
        isEnrolled,
        enrollment,
      }
    })
  } catch (error) {
    console.error('Error fetching course:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch course' },
      { status: 500 }
    )
  }
}
