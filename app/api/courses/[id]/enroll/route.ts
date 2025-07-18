import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { courses, enrollments, orders, paymentTransactions, users } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'
import { EmailService } from '@/lib/email/service'

interface RouteParams {
  params: {
    id: string
  }
}

const enrollmentSchema = z.object({
  paymentMethod: z.enum(['paystack', 'flutterwave']).optional(),
  redirectUrl: z.string().url().optional(),
})

// POST enroll in course
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
    const { paymentMethod = 'paystack', redirectUrl } = enrollmentSchema.parse(body)

    // Check if course exists
    const courseResult = await db
      .select()
      .from(courses)
      .where(eq(courses.id, courseId))
      .limit(1)

    if (!courseResult.length) {
      return NextResponse.json(
        { success: false, error: 'Course not found' },
        { status: 404 }
      )
    }

    const course = courseResult[0]

    if (!course.isPublished) {
      return NextResponse.json(
        { success: false, error: 'Course is not available for enrollment' },
        { status: 400 }
      )
    }

    // Check if already enrolled
    const existingEnrollment = await db
      .select()
      .from(enrollments)
      .where(
        and(
          eq(enrollments.userId, session.user.id),
          eq(enrollments.courseId, courseId)
        )
      )
      .limit(1)

    if (existingEnrollment.length > 0) {
      return NextResponse.json(
        { success: false, error: 'Already enrolled in this course' },
        { status: 400 }
      )
    }

    // If course is free, enroll directly
    if (parseFloat(course.price) === 0) {
      const enrollment = await db.insert(enrollments).values({
        userId: session.user.id,
        courseId: courseId,
        progress: 0,
        enrolledAt: new Date(),
      }).returning()

      // Get instructor information for email
      const instructorInfo = await db
        .select({ name: users.name })
        .from(users)
        .where(eq(users.id, course.instructorId))
        .limit(1)

      // Send welcome email
      await EmailService.sendEnrollmentWelcome({
        userEmail: session.user.email,
        userName: session.user.name || 'Student',
        courseName: course.title,
        courseId: courseId,
        instructorName: instructorInfo[0]?.name || 'DIFY Academy Team',
      })

      return NextResponse.json({
        success: true,
        data: {
          enrollment: enrollment[0],
          paymentRequired: false,
        },
        message: "Successfully enrolled in free course"
      })
    }

    // For paid courses, create order and initiate payment
    const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`

    // Create order record
    const order = await db.insert(orders).values({
      orderNumber,
      userId: session.user.id,
      bookId: courseId, // Using bookId field for course (could be renamed to itemId)
      total: course.price,
      status: 'pending',
      paymentMethod,
      paymentStatus: 'pending',
      createdAt: new Date(),
      updatedAt: new Date(),
    }).returning()

    // Initialize payment based on provider
    let paymentData
    
    if (paymentMethod === 'paystack') {
      paymentData = await initializePaystackPayment({
        email: session.user.email,
        amount: parseFloat(course.price) * 100, // Convert to kobo
        reference: `COURSE-${orderNumber}`,
        orderId: order[0].id,
        courseId,
        courseName: course.title,
        redirectUrl: redirectUrl || `${process.env.NEXT_PUBLIC_APP_URL}/academy/courses/${courseId}`,
      })
    } else {
      paymentData = await initializeFlutterwavePayment({
        email: session.user.email,
        amount: parseFloat(course.price),
        reference: `COURSE-${orderNumber}`,
        orderId: order[0].id,
        courseId,
        courseName: course.title,
        redirectUrl: redirectUrl || `${process.env.NEXT_PUBLIC_APP_URL}/academy/courses/${courseId}`,
      })
    }

    // Create payment transaction record
    await db.insert(paymentTransactions).values({
      orderId: order[0].id,
      reference: paymentData.reference,
      provider: paymentMethod,
      status: 'pending',
      amount: course.price,
      currency: 'NGN',
      customerEmail: session.user.email,
      metadata: {
        courseId,
        courseName: course.title,
        userId: session.user.id,
        type: 'course_enrollment'
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    })

    return NextResponse.json({
      success: true,
      data: {
        order: order[0],
        payment: paymentData,
        paymentRequired: true,
      },
      message: "Payment initialized. Complete payment to enroll."
    })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: "Invalid input", details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error enrolling in course:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to process enrollment' },
      { status: 500 }
    )
  }
}

// Initialize Paystack payment
async function initializePaystackPayment(data: {
  email: string
  amount: number
  reference: string
  orderId: string
  courseId: string
  courseName: string
  redirectUrl: string
}) {
  const response = await fetch('https://api.paystack.co/transaction/initialize', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email: data.email,
      amount: data.amount,
      reference: data.reference,
      callback_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/payment/verify/paystack`,
      metadata: {
        orderId: data.orderId,
        courseId: data.courseId,
        courseName: data.courseName,
        type: 'course_enrollment',
        redirectUrl: data.redirectUrl,
      },
    }),
  })

  const result = await response.json()

  if (!result.status) {
    throw new Error('Failed to initialize Paystack payment')
  }

  return {
    reference: data.reference,
    authorizationUrl: result.data.authorization_url,
    accessCode: result.data.access_code,
    provider: 'paystack',
  }
}

// Initialize Flutterwave payment
async function initializeFlutterwavePayment(data: {
  email: string
  amount: number
  reference: string
  orderId: string
  courseId: string
  courseName: string
  redirectUrl: string
}) {
  const response = await fetch('https://api.flutterwave.com/v3/payments', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.FLUTTERWAVE_SECRET_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      tx_ref: data.reference,
      amount: data.amount,
      currency: 'NGN',
      redirect_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/payment/verify/flutterwave`,
      customer: {
        email: data.email,
      },
      customizations: {
        title: 'DIFY Academy Course Enrollment',
        description: `Enrollment for ${data.courseName}`,
        logo: `${process.env.NEXT_PUBLIC_APP_URL}/placeholder-logo.png`,
      },
      meta: {
        orderId: data.orderId,
        courseId: data.courseId,
        courseName: data.courseName,
        type: 'course_enrollment',
        redirectUrl: data.redirectUrl,
      },
    }),
  })

  const result = await response.json()

  if (result.status !== 'success') {
    throw new Error('Failed to initialize Flutterwave payment')
  }

  return {
    reference: data.reference,
    authorizationUrl: result.data.link,
    provider: 'flutterwave',
  }
}
