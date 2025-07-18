import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { orders, paymentTransactions } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { paystackService } from "@/lib/payment/paystack"

// POST /api/webhooks/paystack - Handle Paystack webhook events
export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const signature = request.headers.get("x-paystack-signature") || ""

    // Verify webhook signature
    if (!paystackService.validateWebhook(body, signature)) {
      console.error("Invalid Paystack webhook signature")
      return NextResponse.json(
        { success: false, error: "Invalid signature" },
        { status: 400 }
      )
    }

    const event = JSON.parse(body)
    
    console.log("Paystack webhook event:", event.event)

    switch (event.event) {
      case "charge.success":
        await handlePaystackPaymentSuccess(event.data)
        break
      
      case "charge.failed":
        await handlePaystackPaymentFailed(event.data)
        break
      
      case "transfer.success":
        await handlePaystackTransferSuccess(event.data)
        break
      
      case "transfer.failed":
        await handlePaystackTransferFailed(event.data)
        break
      
      default:
        console.log(`Unhandled Paystack event: ${event.event}`)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Paystack webhook error:", error)
    return NextResponse.json(
      { success: false, error: "Webhook processing failed" },
      { status: 500 }
    )
  }
}

async function handlePaystackPaymentSuccess(data: any) {
  try {
    const reference = data.reference
    const metadata = data.metadata || {}
    const orderId = metadata.orderId

    if (!orderId) {
      console.error("No order ID in payment metadata")
      return
    }

    // Find the order
    const order = await db
      .select()
      .from(orders)
      .where(eq(orders.id, orderId))
      .limit(1)

    if (!order[0]) {
      console.error(`Order not found: ${orderId}`)
      return
    }

    // Update or create payment transaction
    const existingTransaction = await db
      .select()
      .from(paymentTransactions)
      .where(eq(paymentTransactions.reference, reference))
      .limit(1)

    const transactionData = {
      orderId: orderId,
      reference: reference,
      provider: "paystack" as const,
      status: "successful" as const,
      amount: paystackService.fromKobo(data.amount),
      currency: data.currency,
      customerEmail: data.customer.email,
      metadata: metadata,
      providerResponse: data,
      verifiedAt: new Date(),
    }

    if (existingTransaction[0]) {
      await db
        .update(paymentTransactions)
        .set(transactionData)
        .where(eq(paymentTransactions.reference, reference))
    } else {
      await db.insert(paymentTransactions).values(transactionData)
    }

    // Update order status
    await db
      .update(orders)
      .set({
        status: "confirmed",
        paymentStatus: "completed",
        paidAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(orders.id, orderId))

    console.log(`Payment confirmed for order: ${orderId}`)
  } catch (error) {
    console.error("Error handling Paystack payment success:", error)
  }
}

async function handlePaystackPaymentFailed(data: any) {
  try {
    const reference = data.reference
    const metadata = data.metadata || {}
    const orderId = metadata.orderId

    if (!orderId) {
      console.error("No order ID in payment metadata")
      return
    }

    // Update or create payment transaction
    const existingTransaction = await db
      .select()
      .from(paymentTransactions)
      .where(eq(paymentTransactions.reference, reference))
      .limit(1)

    const transactionData = {
      orderId: orderId,
      reference: reference,
      provider: "paystack" as const,
      status: "failed" as const,
      amount: paystackService.fromKobo(data.amount),
      currency: data.currency,
      customerEmail: data.customer.email,
      metadata: metadata,
      providerResponse: data,
      verifiedAt: new Date(),
    }

    if (existingTransaction[0]) {
      await db
        .update(paymentTransactions)
        .set(transactionData)
        .where(eq(paymentTransactions.reference, reference))
    } else {
      await db.insert(paymentTransactions).values(transactionData)
    }

    // Update order status
    await db
      .update(orders)
      .set({
        paymentStatus: "failed",
        updatedAt: new Date(),
      })
      .where(eq(orders.id, orderId))

    console.log(`Payment failed for order: ${orderId}`)
  } catch (error) {
    console.error("Error handling Paystack payment failure:", error)
  }
}

async function handlePaystackTransferSuccess(data: any) {
  console.log("Paystack transfer successful:", data)
  // Handle successful transfers/refunds here
}

async function handlePaystackTransferFailed(data: any) {
  console.log("Paystack transfer failed:", data)
  // Handle failed transfers/refunds here
}
