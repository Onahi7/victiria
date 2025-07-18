import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { paymentTransactions, bookSubmissions } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

// Verify Paystack payment for submission fee
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const reference = searchParams.get('reference')
    const trxref = searchParams.get('trxref')

    if (!reference && !trxref) {
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/publishing?error=missing_reference`)
    }

    const paymentRef = reference || trxref

    // Verify payment with Paystack
    const verifyResponse = await fetch(`https://api.paystack.co/transaction/verify/${paymentRef}`, {
      headers: {
        'Authorization': `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
      },
    })

    const verificationResult = await verifyResponse.json()

    if (!verificationResult.status || verificationResult.data.status !== 'success') {
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/publishing?error=payment_failed`)
    }

    // Update payment transaction
    const transaction = await db
      .select()
      .from(paymentTransactions)
      .where(eq(paymentTransactions.reference, paymentRef))
      .limit(1)

    if (!transaction.length) {
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/publishing?error=transaction_not_found`)
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

    // Update submission status
    const metadata = transaction[0].metadata as any
    
    await db
      .update(bookSubmissions)
      .set({
        feePaymentStatus: 'completed',
        status: 'submitted',
        submittedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(bookSubmissions.id, metadata.submissionId))

    // Redirect to submission page with success
    const redirectUrl = metadata.redirectUrl || `${process.env.NEXT_PUBLIC_APP_URL}/publishing/submissions/${metadata.submissionId}?payment=success`
    
    return NextResponse.redirect(redirectUrl)

  } catch (error) {
    console.error('Error verifying submission payment:', error)
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/publishing?error=verification_failed`)
  }
}
