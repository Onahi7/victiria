import { NextRequest, NextResponse } from 'next/server'

// POST /api/payment/mtn-momo/callback
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    console.log('MTN MOMO callback received:', body)

    // MTN MOMO callback typically includes:
    // - transactionId
    // - status
    // - amount
    // - currency
    // - externalId (our transaction reference)

    const { transactionId, status, amount, currency, externalId } = body

    // Update payment record in database
    // TODO: Update your payment_transactions table with the callback data
    
    if (status === 'SUCCESSFUL') {
      // Payment was successful
      // Update order status, send confirmation email, etc.
      console.log(`MTN MOMO payment successful: ${transactionId}`)
      
      // TODO: Update order status to 'paid'
      // TODO: Send confirmation email
      // TODO: Grant access to purchased books
      
    } else if (status === 'FAILED') {
      // Payment failed
      console.log(`MTN MOMO payment failed: ${transactionId}`)
      
      // TODO: Update order status to 'failed'
      // TODO: Send failure notification
      
    } else {
      // Payment is still pending
      console.log(`MTN MOMO payment pending: ${transactionId}`)
    }

    // Always return success to MTN MOMO to acknowledge receipt
    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('MTN MOMO callback error:', error)
    
    // Still return success to avoid repeated callbacks
    return NextResponse.json({ success: true })
  }
}

// GET /api/payment/mtn-momo/callback (for testing)
export async function GET(request: NextRequest) {
  return NextResponse.json({
    message: "MTN MOMO callback endpoint is working",
    timestamp: new Date().toISOString()
  })
}
