import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { orders, paymentTransactions } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { flutterwaveService } from "@/lib/payment/flutterwave"

// POST /api/webhooks/flutterwave - Handle Flutterwave webhook events
export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const signature = request.headers.get("verif-hash") || ""

    // Verify webhook signature
    if (!flutterwaveService.validateWebhook(body, signature)) {
      console.error("Invalid Flutterwave webhook signature")
      return NextResponse.json(
        { success: false, error: "Invalid signature" },
        { status: 400 }
      )
    }

    const event = JSON.parse(body)
    
    console.log("Flutterwave webhook event:", event.event)

    switch (event.event) {
      case "charge.completed":
        await handleFlutterwavePaymentCompleted(event.data)
        break
      
      case "charge.failed":
        await handleFlutterwavePaymentFailed(event.data)
        break
      
      case "transfer.completed":
        await handleFlutterwaveTransferCompleted(event.data)
        break
      
      case "transfer.failed":
        await handleFlutterwaveTransferFailed(event.data)
        break
      
      default:
        console.log(`Unhandled Flutterwave event: ${event.event}`)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Flutterwave webhook error:", error)
    return NextResponse.json(
      { success: false, error: "Webhook processing failed" },
      { status: 500 }
    )
  }
}

async function handleFlutterwavePaymentCompleted(data: any) {
  try {
    const txRef = data.tx_ref
    const meta = data.meta || {}
    const orderId = meta.orderId

    if (!orderId) {
      console.error("No order ID in payment metadata")
      return
    }

    // Verify the payment with Flutterwave API
    const verification = await flutterwaveService.verifyPayment(data.id.toString())
    
    if (verification.status !== "success" || verification.data.status !== "successful") {
      console.error("Payment verification failed:", verification)
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
      .where(eq(paymentTransactions.reference, txRef))
      .limit(1)

    const transactionData = {
      orderId: orderId,
      reference: txRef,
      provider: "flutterwave" as const,
      status: "successful" as const,
      amount: data.amount,
      currency: data.currency,
      customerEmail: data.customer.email,
      metadata: meta,
      providerResponse: data,
      verifiedAt: new Date(),
    }

    if (existingTransaction[0]) {
      await db
        .update(paymentTransactions)
        .set(transactionData)
        .where(eq(paymentTransactions.reference, txRef))
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
    console.error("Error handling Flutterwave payment completion:", error)
  }
}

async function handleFlutterwavePaymentFailed(data: any) {
  try {
    const txRef = data.tx_ref
    const meta = data.meta || {}
    const orderId = meta.orderId

    if (!orderId) {
      console.error("No order ID in payment metadata")
      return
    }

    // Update or create payment transaction
    const existingTransaction = await db
      .select()
      .from(paymentTransactions)
      .where(eq(paymentTransactions.reference, txRef))
      .limit(1)

    const transactionData = {
      orderId: orderId,
      reference: txRef,
      provider: "flutterwave" as const,
      status: "failed" as const,
      amount: data.amount || 0,
      currency: data.currency || "NGN",
      customerEmail: data.customer?.email || "",
      metadata: meta,
      providerResponse: data,
      verifiedAt: new Date(),
    }

    if (existingTransaction[0]) {
      await db
        .update(paymentTransactions)
        .set(transactionData)
        .where(eq(paymentTransactions.reference, txRef))
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
    console.error("Error handling Flutterwave payment failure:", error)
  }
}

async function handleFlutterwaveTransferCompleted(data: any) {
  console.log("Flutterwave transfer completed:", data)
  // Handle successful transfers/refunds here
}

async function handleFlutterwaveTransferFailed(data: any) {
  console.log("Flutterwave transfer failed:", data)
  // Handle failed transfers/refunds here
}
