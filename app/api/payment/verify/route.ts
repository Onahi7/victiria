import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { orders, paymentTransactions } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { paymentService } from "@/lib/payment/service"
import { PaymentMethod, paymentMethods } from "@/lib/payment/config"
import { Resend } from "resend"

const resend = new Resend(process.env.RESEND_API_KEY)

const verifyPaymentSchema = z.object({
  reference: z.string().min(1, "Payment reference is required"),
  provider: z.enum(["paystack", "flutterwave"]),
  orderId: z.string().min(1, "Order ID is required"),
})

// POST /api/payment/verify - Verify payment and update order status
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { reference, provider, orderId } = verifyPaymentSchema.parse(body)

    // Get order details
    const order = await db
      .select()
      .from(orders)
      .where(eq(orders.id, orderId))
      .limit(1)

    if (!order[0]) {
      return NextResponse.json(
        { success: false, error: "Order not found" },
        { status: 404 }
      )
    }

    // Verify order belongs to current user (unless admin)
    if (session.user.role !== "admin" && order[0].userId !== session.user.id) {
      return NextResponse.json(
        { success: false, error: "Unauthorized to access this order" },
        { status: 403 }
      )
    }

    // Check if payment was already verified
    const existingTransaction = await db
      .select()
      .from(paymentTransactions)
      .where(eq(paymentTransactions.reference, reference))
      .limit(1)

    if (existingTransaction[0] && existingTransaction[0].status === "successful") {
      return NextResponse.json({
        success: true,
        data: {
          alreadyVerified: true,
          status: existingTransaction[0].status,
          orderId: orderId,
        },
        message: "Payment already verified"
      })
    }

    // Verify payment with the provider
    const verificationResult = await paymentService.verifyPayment(
      provider as PaymentMethod,
      reference
    )

    // Create or update payment transaction record
    const transactionData = {
      orderId: orderId,
      reference: reference,
      provider: provider,
      status: verificationResult.success ? "successful" : "failed",
      amount: verificationResult.amount,
      currency: verificationResult.currency,
      customerEmail: verificationResult.customerEmail,
      metadata: verificationResult.metadata || {},
      providerResponse: verificationResult.data,
      verifiedAt: new Date(),
    }

    if (existingTransaction[0]) {
      // Update existing transaction
      await db
        .update(paymentTransactions)
        .set(transactionData)
        .where(eq(paymentTransactions.reference, reference))
    } else {
      // Create new transaction record
      await db.insert(paymentTransactions).values(transactionData)
    }

    if (verificationResult.success && verificationResult.status === "successful") {
      // Update order status to confirmed
      await db
        .update(orders)
        .set({
          status: "confirmed",
          paymentStatus: "completed",
          paidAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(orders.id, orderId))

      // Send payment confirmation email
      try {
        await sendPaymentConfirmationEmail(
          verificationResult.customerEmail,
          order[0].orderNumber,
          verificationResult.amount,
          verificationResult.currency
        )
      } catch (emailError) {
        console.error("Failed to send confirmation email:", emailError)
        // Don't fail the verification if email fails
      }

      return NextResponse.json({
        success: true,
        data: {
          status: "successful",
          amount: verificationResult.amount,
          currency: verificationResult.currency,
          orderId: orderId,
          verifiedAt: new Date().toISOString(),
        },
        message: "Payment verified successfully"
      })
    } else {
      // Update order status to indicate payment failure
      await db
        .update(orders)
        .set({
          paymentStatus: "failed",
          updatedAt: new Date(),
        })
        .where(eq(orders.id, orderId))

      return NextResponse.json({
        success: false,
        data: {
          status: verificationResult.status,
          orderId: orderId,
        },
        error: "Payment verification failed"
      }, { status: 400 })
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: "Invalid input", details: error.errors },
        { status: 400 }
      )
    }

    console.error("Payment verification error:", error)
    return NextResponse.json(
      { success: false, error: "Failed to verify payment" },
      { status: 500 }
    )
  }
}

// Helper function to send payment confirmation email
async function sendPaymentConfirmationEmail(
  email: string,
  orderNumber: string,
  amount: number,
  currency: string
) {
  const formattedAmount = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency,
  }).format(amount)

  await resend.emails.send({
    from: process.env.FROM_EMAIL || "noreply@edifybooks.com",
    to: email,
    subject: `Payment Confirmed - Order ${orderNumber}`,
    html: `
      <div style="max-width: 600px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif;">
        <h2 style="color: #28a745; text-align: center;">Payment Confirmed!</h2>
        <p>Thank you for your purchase!</p>
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0;">
          <h3 style="margin-top: 0;">Order Details:</h3>
          <p><strong>Order Number:</strong> ${orderNumber}</p>
          <p><strong>Amount Paid:</strong> ${formattedAmount}</p>
          <p><strong>Status:</strong> Confirmed</p>
        </div>
        <p>Your order is now being processed and you will receive updates on its progress.</p>
        <p>You can track your order status in your <a href="${process.env.NEXTAUTH_URL}/dashboard/orders">dashboard</a>.</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
        <p style="color: #666; font-size: 12px; text-align: center;">EdifyPub Team</p>
      </div>
    `,
  })
}
