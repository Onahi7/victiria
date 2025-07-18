import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { enrollments, courses, users } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'
import { EmailService } from '@/lib/email/service'

interface RouteParams {
  params: {
    id: string
  }
}

// PATCH update enrollment progress/completion
export async function PATCH(request: NextRequest, { params }: RouteParams) {
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
    const { progress, moduleId } = body

    // Validate progress
    if (typeof progress !== 'number' || progress < 0 || progress > 100) {
      return NextResponse.json(
        { success: false, error: "Invalid progress value" },
        { status: 400 }
      )
    }

    // Check if user is enrolled
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
        { success: false, error: "Not enrolled in this course" },
        { status: 403 }
      )
    }

    const currentEnrollment = enrollment[0]
    const wasCompleted = currentEnrollment.progress === 100
    const isNowCompleted = progress === 100

    // Update enrollment
    const updateData: any = {
      progress,
      updatedAt: new Date(),
    }

    // If course is being completed for the first time
    if (!wasCompleted && isNowCompleted) {
      updateData.completedAt = new Date()
    }

    const updatedEnrollment = await db
      .update(enrollments)
      .set(updateData)
      .where(eq(enrollments.id, currentEnrollment.id))
      .returning()

    // Send completion email if just completed
    if (!wasCompleted && isNowCompleted) {
      try {
        // Get course info
        const courseInfo = await db
          .select({ title: courses.title })
          .from(courses)
          .where(eq(courses.id, courseId))
          .limit(1)

        if (courseInfo[0]) {
          await EmailService.sendCourseCompletion({
            userEmail: session.user.email,
            userName: session.user.name || 'Student',
            courseName: courseInfo[0].title,
            courseId: courseId,
            completionDate: new Date(),
          })
        }
      } catch (error) {
        console.error('Failed to send completion email:', error)
        // Don't fail the request if email fails
      }
    }

    return NextResponse.json({
      success: true,
      data: updatedEnrollment[0],
      message: isNowCompleted ? "Congratulations! Course completed!" : "Progress updated"
    })

  } catch (error) {
    console.error('Error updating enrollment progress:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update progress' },
      { status: 500 }
    )
  }
}
