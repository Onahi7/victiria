import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { orders, books, users } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { paymentService, PaymentIntentData } from "@/lib/payment/service"
import { PaymentMethod, paymentMethods } from "@/lib/payment/config"

const initializePaymentSchema = z.object({
  orderId: z.string().min(1, "Order ID is required"),
  paymentMethod: z.enum(["paystack", "flutterwave"]),
  currency: z.string().min(3).max(3).default("NGN"),
  callbackUrl: z.string().url("Invalid callback URL").optional(),
})

// POST /api/payment/initialize - Initialize payment for an order
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
    const { orderId, paymentMethod, currency, callbackUrl } = initializePaymentSchema.parse(body)

    // Get order details with book and user information
    const orderQuery = await db
      .select({
        order: orders,
        book: books,
        user: users,
      })
      .from(orders)
      .innerJoin(books, eq(orders.bookId, books.id))
      .innerJoin(users, eq(orders.userId, users.id))
      .where(eq(orders.id, orderId))
      .limit(1)

    if (!orderQuery[0]) {
      return NextResponse.json(
        { success: false, error: "Order not found" },
        { status: 404 }
      )
    }

    const { order, book, user } = orderQuery[0]

    // Verify order belongs to current user (unless admin)
    if (session.user.role !== "admin" && order.userId !== session.user.id) {
      return NextResponse.json(
        { success: false, error: "Unauthorized to access this order" },
        { status: 403 }
      )
    }

    // Check if order is in correct status for payment
    if (order.status !== "pending") {
      return NextResponse.json(
        { success: false, error: "Order is not available for payment" },
        { status: 400 }
      )
    }

    // Check if book is still available
    if (!book.isAvailable) {
      return NextResponse.json(
        { success: false, error: "Book is no longer available" },
        { status: 400 }
      )
    }

    // Prepare payment data
    const paymentData: PaymentIntentData = {
      orderId: order.id,
      userId: user.id,
      bookId: book.id,
      amount: order.total,
      currency: currency,
      customerEmail: user.email,
      customerName: user.name,
      customerPhone: user.phone || undefined,
      callbackUrl: callbackUrl || `${process.env.NEXTAUTH_URL}/orders/${order.id}/payment-callback`,
      metadata: {
        orderNumber: order.orderNumber,
        bookTitle: book.title,
        bookAuthor: book.author,
      },
    }

    // Initialize payment with the selected provider
    const paymentResult = await paymentService.initializePayment(
      paymentMethod as PaymentMethod,
      paymentData
    )

    if (!paymentResult.success) {
      return NextResponse.json(
        { success: false, error: paymentResult.error },
        { status: 400 }
      )
    }

    // Update order with payment reference
    await db
      .update(orders)
      .set({
        paymentReference: paymentResult.reference,
        paymentMethod: paymentMethod,
        updatedAt: new Date(),
      })
      .where(eq(orders.id, orderId))

    return NextResponse.json({
      success: true,
      data: {
        paymentUrl: paymentResult.paymentUrl,
        reference: paymentResult.reference,
        provider: paymentResult.provider,
        amount: paymentData.amount,
        currency: paymentData.currency,
        orderId: orderId,
      },
      message: "Payment initialized successfully"
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: "Invalid input", details: error.errors },
        { status: 400 }
      )
    }

    console.error("Payment initialization error:", error)
    return NextResponse.json(
      { success: false, error: "Failed to initialize payment" },
      { status: 500 }
    )
  }
}
