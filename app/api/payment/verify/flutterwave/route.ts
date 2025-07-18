import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { orders, paymentTransactions, enrollments, courses, users } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { EmailService } from '@/lib/email/service'

// Verify Flutterwave payment
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const tx_ref = searchParams.get('tx_ref')
    const transaction_id = searchParams.get('transaction_id')

    if (status !== 'successful' || !tx_ref) {
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/academy?error=payment_failed`)
    }

    // Verify payment with Flutterwave
    const verifyResponse = await fetch(`https://api.flutterwave.com/v3/transactions/${transaction_id}/verify`, {
      headers: {
        'Authorization': `Bearer ${process.env.FLUTTERWAVE_SECRET_KEY}`,
      },
    })

    const verificationResult = await verifyResponse.json()

    if (verificationResult.status !== 'success' || verificationResult.data.status !== 'successful') {
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/academy?error=payment_failed`)
    }

    // Update payment transaction
    const transaction = await db
      .select()
      .from(paymentTransactions)
      .where(eq(paymentTransactions.reference, tx_ref))
      .limit(1)

    if (!transaction.length) {
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/academy?error=transaction_not_found`)
    }

    // Update transaction status
    await db
      .update(paymentTransactions)
      .set({
        status: 'successful',
        providerResponse: verificationResult.data,
        verifiedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(paymentTransactions.id, transaction[0].id))

    // Update order status
    await db
      .update(orders)
      .set({
        status: 'delivered',
        paymentStatus: 'completed',
        paymentReference: tx_ref,
        paidAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(orders.id, transaction[0].orderId))

    // Create enrollment
    const metadata = transaction[0].metadata as any
    
    await db.insert(enrollments).values({
      userId: metadata.userId,
      courseId: metadata.courseId,
      progress: 0,
      enrolledAt: new Date(),
    })

    // Get course and user info for welcome email
    const [courseInfo, userInfo, instructorInfo] = await Promise.all([
      db.select({ title: courses.title, instructorId: courses.instructorId })
        .from(courses)
        .where(eq(courses.id, metadata.courseId))
        .limit(1),
      db.select({ email: users.email, name: users.name })
        .from(users)
        .where(eq(users.id, metadata.userId))
        .limit(1),
      db.select({ name: users.name })
        .from(users)
        .where(eq(courses.instructorId, users.id))
        .limit(1)
    ])

    // Send welcome email
    if (courseInfo[0] && userInfo[0]) {
      await EmailService.sendEnrollmentWelcome({
        userEmail: userInfo[0].email,
        userName: userInfo[0].name || 'Student',
        courseName: courseInfo[0].title,
        courseId: metadata.courseId,
        instructorName: instructorInfo[0]?.name || 'DIFY Academy Team',
      })
    }

    // Redirect to course or success page
    const redirectUrl = metadata.redirectUrl || `${process.env.NEXT_PUBLIC_APP_URL}/academy/courses/${metadata.courseId}?enrolled=true`
    
    return NextResponse.redirect(redirectUrl)

  } catch (error) {
    console.error('Error verifying Flutterwave payment:', error)
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/academy?error=verification_failed`)
  }
}
