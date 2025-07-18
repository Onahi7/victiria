import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { bookSubmissions, paymentTransactions } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'

interface RouteParams {
  params: {
    id: string
  }
}

const paymentSchema = z.object({
  paymentMethod: z.enum(['paystack', 'flutterwave']).default('paystack'),
  redirectUrl: z.string().url().optional(),
})

// POST pay submission fee
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth()
    
    if (!session) {
      return NextResponse.json(
        { success: false, error: "Authentication required" },
        { status: 401 }
      )
    }

    const submissionId = params.id
    const body = await request.json()
    const { paymentMethod, redirectUrl } = paymentSchema.parse(body)

    // Check if submission exists and belongs to user
    const submission = await db
      .select()
      .from(bookSubmissions)
      .where(
        and(
          eq(bookSubmissions.id, submissionId),
          eq(bookSubmissions.authorId, session.user.id)
        )
      )
      .limit(1)

    if (!submission.length) {
      return NextResponse.json(
        { success: false, error: 'Submission not found' },
        { status: 404 }
      )
    }

    const submissionData = submission[0]

    if (submissionData.feePaymentStatus === 'completed') {
      return NextResponse.json(
        { success: false, error: 'Submission fee already paid' },
        { status: 400 }
      )
    }

    // Generate payment reference
    const paymentReference = `SUB-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`

    // Initialize payment
    let paymentData
    const amount = parseFloat(submissionData.submissionFee)

    if (paymentMethod === 'paystack') {
      paymentData = await initializePaystackPayment({
        email: session.user.email,
        amount: amount * 100, // Convert to kobo
        reference: paymentReference,
        submissionId,
        submissionTitle: submissionData.title,
        redirectUrl: redirectUrl || `${process.env.NEXT_PUBLIC_APP_URL}/publishing/submissions/${submissionId}`,
      })
    } else {
      paymentData = await initializeFlutterwavePayment({
        email: session.user.email,
        amount: amount,
        reference: paymentReference,
        submissionId,
        submissionTitle: submissionData.title,
        redirectUrl: redirectUrl || `${process.env.NEXT_PUBLIC_APP_URL}/publishing/submissions/${submissionId}`,
      })
    }

    // Create payment transaction record
    await db.insert(paymentTransactions).values({
      orderId: submissionId, // Using orderId field for submission
      reference: paymentReference,
      provider: paymentMethod,
      status: 'pending',
      amount: submissionData.submissionFee,
      currency: 'NGN',
      customerEmail: session.user.email,
      metadata: {
        submissionId,
        submissionTitle: submissionData.title,
        userId: session.user.id,
        type: 'submission_fee'
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    })

    // Update submission with payment reference
    await db
      .update(bookSubmissions)
      .set({
        feePaymentReference: paymentReference,
        updatedAt: new Date(),
      })
      .where(eq(bookSubmissions.id, submissionId))

    return NextResponse.json({
      success: true,
      data: {
        submission: submissionData,
        payment: paymentData,
      },
      message: "Payment initialized. Complete payment to submit for review."
    })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: "Invalid input", details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error processing submission payment:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to process payment' },
      { status: 500 }
    )
  }
}

// Initialize Paystack payment
async function initializePaystackPayment(data: {
  email: string
  amount: number
  reference: string
  submissionId: string
  submissionTitle: string
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
      callback_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/payment/verify/submission/paystack`,
      metadata: {
        submissionId: data.submissionId,
        submissionTitle: data.submissionTitle,
        type: 'submission_fee',
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
  submissionId: string
  submissionTitle: string
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
      redirect_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/payment/verify/submission/flutterwave`,
      customer: {
        email: data.email,
      },
      customizations: {
        title: 'Book Submission Fee',
        description: `Submission fee for "${data.submissionTitle}"`,
        logo: `${process.env.NEXT_PUBLIC_APP_URL}/placeholder-logo.png`,
      },
      meta: {
        submissionId: data.submissionId,
        submissionTitle: data.submissionTitle,
        type: 'submission_fee',
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
