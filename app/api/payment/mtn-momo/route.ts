import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'

// MTN MOMO API configuration
const MTN_MOMO_CONFIG = {
  baseUrl: process.env.MTN_MOMO_BASE_URL || 'https://sandbox.momodeveloper.mtn.com',
  subscriptionKey: process.env.MTN_MOMO_SUBSCRIPTION_KEY,
  userId: process.env.MTN_MOMO_USER_ID,
  apiKey: process.env.MTN_MOMO_API_KEY,
  targetEnvironment: process.env.MTN_MOMO_TARGET_ENVIRONMENT || 'sandbox'
}

// Generate a unique transaction reference
function generateTransactionRef(): string {
  return `victiria_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

// POST /api/payment/mtn-momo/initialize
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session) {
      return NextResponse.json(
        { success: false, error: "Authentication required" },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { orderId, amount, currency, phoneNumber, email } = body

    // Validate required fields
    if (!orderId || !amount || !phoneNumber) {
      return NextResponse.json(
        { success: false, error: "Missing required fields: orderId, amount, phoneNumber" },
        { status: 400 }
      )
    }

    // Validate currency (MTN MOMO typically works with local currencies, but we'll accept USD for international)
    if (currency !== 'USD' && currency !== 'EUR') {
      return NextResponse.json(
        { success: false, error: "MTN MOMO only supports USD and EUR for international payments" },
        { status: 400 }
      )
    }

    // Generate transaction reference
    const transactionRef = generateTransactionRef()

    // Create MTN MOMO payment request
    const momoPayload = {
      amount: amount.toString(),
      currency: currency,
      externalId: transactionRef,
      payer: {
        partyIdType: 'MSISDN',
        partyId: phoneNumber.replace(/[^\d]/g, '') // Clean phone number
      },
      payerMessage: `Payment for Victiria book order ${orderId}`,
      payeeNote: `Book purchase - Order ${orderId}`,
      callbackUrl: `${process.env.NEXTAUTH_URL}/api/payment/mtn-momo/callback`
    }

    // Get MTN MOMO access token
    const tokenResponse = await fetch(`${MTN_MOMO_CONFIG.baseUrl}/collection/token/`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${Buffer.from(`${MTN_MOMO_CONFIG.userId}:${MTN_MOMO_CONFIG.apiKey}`).toString('base64')}`,
        'Ocp-Apim-Subscription-Key': MTN_MOMO_CONFIG.subscriptionKey!,
        'X-Target-Environment': MTN_MOMO_CONFIG.targetEnvironment,
        'Content-Type': 'application/json'
      }
    })

    if (!tokenResponse.ok) {
      throw new Error('Failed to get MTN MOMO access token')
    }

    const tokenData = await tokenResponse.json()
    const accessToken = tokenData.access_token

    // Request payment
    const paymentResponse = await fetch(`${MTN_MOMO_CONFIG.baseUrl}/collection/v1_0/requesttopay`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'X-Reference-Id': transactionRef,
        'X-Target-Environment': MTN_MOMO_CONFIG.targetEnvironment,
        'Ocp-Apim-Subscription-Key': MTN_MOMO_CONFIG.subscriptionKey!,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(momoPayload)
    })

    if (!paymentResponse.ok) {
      const errorData = await paymentResponse.json()
      throw new Error(errorData.message || 'Failed to initialize MTN MOMO payment')
    }

    // Store payment reference in database for tracking
    // TODO: Add to your payment_transactions table
    
    return NextResponse.json({
      success: true,
      data: {
        transactionRef,
        paymentUrl: null, // MTN MOMO is typically a push notification to phone
        message: 'Payment request sent to your phone. Please check your mobile money app and approve the transaction.',
        orderId,
        amount,
        currency,
        gateway: 'mtn-momo'
      },
      message: "MTN MOMO payment initialized successfully"
    })

  } catch (error) {
    console.error('MTN MOMO payment error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to initialize MTN MOMO payment' 
      },
      { status: 500 }
    )
  }
}

// GET /api/payment/mtn-momo/status/:transactionRef
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session) {
      return NextResponse.json(
        { success: false, error: "Authentication required" },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const transactionRef = searchParams.get('transactionRef')

    if (!transactionRef) {
      return NextResponse.json(
        { success: false, error: "Transaction reference is required" },
        { status: 400 }
      )
    }

    // Get MTN MOMO access token
    const tokenResponse = await fetch(`${MTN_MOMO_CONFIG.baseUrl}/collection/token/`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${Buffer.from(`${MTN_MOMO_CONFIG.userId}:${MTN_MOMO_CONFIG.apiKey}`).toString('base64')}`,
        'Ocp-Apim-Subscription-Key': MTN_MOMO_CONFIG.subscriptionKey!,
        'X-Target-Environment': MTN_MOMO_CONFIG.targetEnvironment,
        'Content-Type': 'application/json'
      }
    })

    if (!tokenResponse.ok) {
      throw new Error('Failed to get MTN MOMO access token')
    }

    const tokenData = await tokenResponse.json()
    const accessToken = tokenData.access_token

    // Check transaction status
    const statusResponse = await fetch(`${MTN_MOMO_CONFIG.baseUrl}/collection/v1_0/requesttopay/${transactionRef}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'X-Target-Environment': MTN_MOMO_CONFIG.targetEnvironment,
        'Ocp-Apim-Subscription-Key': MTN_MOMO_CONFIG.subscriptionKey!
      }
    })

    if (!statusResponse.ok) {
      throw new Error('Failed to get transaction status')
    }

    const statusData = await statusResponse.json()

    return NextResponse.json({
      success: true,
      data: {
        transactionRef,
        status: statusData.status, // PENDING, SUCCESSFUL, FAILED
        amount: statusData.amount,
        currency: statusData.currency,
        reason: statusData.reason
      }
    })

  } catch (error) {
    console.error('MTN MOMO status check error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to check payment status' 
      },
      { status: 500 }
    )
  }
}
