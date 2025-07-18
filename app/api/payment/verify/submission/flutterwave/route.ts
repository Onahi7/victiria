import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { paymentTransactions, bookSubmissions } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

// Verify Flutterwave payment for submission fee
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const tx_ref = searchParams.get('tx_ref')
    const transaction_id = searchParams.get('transaction_id')

    if (status !== 'successful' || !tx_ref) {
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/publishing?error=payment_failed`)
    }

    // Verify payment with Flutterwave
    const verifyResponse = await fetch(`https://api.flutterwave.com/v3/transactions/${transaction_id}/verify`, {
      headers: {
        'Authorization': `Bearer ${process.env.FLUTTERWAVE_SECRET_KEY}`,
      },
    })

    const verificationResult = await verifyResponse.json()

    if (verificationResult.status !== 'success' || verificationResult.data.status !== 'successful') {
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/publishing?error=payment_failed`)
    }

    // Update payment transaction
    const transaction = await db
      .select()
      .from(paymentTransactions)
      .where(eq(paymentTransactions.reference, tx_ref))
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
