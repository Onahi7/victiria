import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { orders, books, users } from "@/lib/db/schema"
import { eq, and } from "drizzle-orm"

const updateOrderSchema = z.object({
  status: z.enum(["pending", "confirmed", "processing", "shipped", "delivered", "cancelled"]).optional(),
  trackingNumber: z.string().optional(),
  notes: z.string().optional(),
})

// GET /api/orders/[id] - Get single order
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()
    
    if (!session) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      )
    }

    // Build query with joins
    const orderQuery = db
      .select({
        id: orders.id,
        orderNumber: orders.orderNumber,
        status: orders.status,
        total: orders.total,
        paymentMethod: orders.paymentMethod,
        shippingAddress: orders.shippingAddress,
        billingAddress: orders.billingAddress,
        trackingNumber: orders.trackingNumber,
        notes: orders.notes,
        createdAt: orders.createdAt,
        updatedAt: orders.updatedAt,
        book: {
          id: books.id,
          title: books.title,
          author: books.author,
          price: books.price,
          coverImage: books.coverImage,
          description: books.description,
        },
        user: session.user.role === "admin" ? {
          id: users.id,
          name: users.name,
          email: users.email,
        } : undefined,
      })
      .from(orders)
      .innerJoin(books, eq(orders.bookId, books.id))

    // Add user join for admin
    if (session.user.role === "admin") {
      orderQuery.innerJoin(users, eq(orders.userId, users.id))
    }

    // Build where conditions
    const conditions = [eq(orders.id, params.id)]
    
    // Non-admin users can only see their own orders
    if (session.user.role !== "admin") {
      conditions.push(eq(orders.userId, session.user.id))
    }

    const order = await orderQuery
      .where(and(...conditions))
      .limit(1)

    if (!order[0]) {
      return NextResponse.json(
        { success: false, error: "Order not found" },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: order[0]
    })
  } catch (error) {
    console.error("Error fetching order:", error)
    return NextResponse.json(
      { success: false, error: "Failed to fetch order" },
      { status: 500 }
    )
  }
}

// PUT /api/orders/[id] - Update order (admin only for status updates)
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()
    
    if (!session) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      )
    }

    const body = await request.json()
    const updateData = updateOrderSchema.parse(body)

    // Check if order exists
    const conditions = [eq(orders.id, params.id)]
    
    // Non-admin users can only update their own orders (limited fields)
    if (session.user.role !== "admin") {
      conditions.push(eq(orders.userId, session.user.id))
      
      // Non-admin users cannot update status or tracking number
      if (updateData.status || updateData.trackingNumber) {
        return NextResponse.json(
          { success: false, error: "Insufficient permissions" },
          { status: 403 }
        )
      }
    }

    const existingOrder = await db
      .select()
      .from(orders)
      .where(and(...conditions))
      .limit(1)

    if (!existingOrder[0]) {
      return NextResponse.json(
        { success: false, error: "Order not found" },
        { status: 404 }
      )
    }

    // Prevent updating cancelled or delivered orders
    if (existingOrder[0].status === "cancelled" || existingOrder[0].status === "delivered") {
      return NextResponse.json(
        { success: false, error: "Cannot update completed orders" },
        { status: 400 }
      )
    }

    const updatedOrder = await db
      .update(orders)
      .set({
        ...updateData,
        updatedAt: new Date(),
      })
      .where(eq(orders.id, params.id))
      .returning()

    // TODO: Send status update email to customer

    return NextResponse.json({
      success: true,
      data: updatedOrder[0],
      message: "Order updated successfully"
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: "Invalid input", details: error.errors },
        { status: 400 }
      )
    }

    console.error("Error updating order:", error)
    return NextResponse.json(
      { success: false, error: "Failed to update order" },
      { status: 500 }
    )
  }
}

// DELETE /api/orders/[id] - Cancel order
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()
    
    if (!session) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      )
    }

    // Check if order exists and user has permission
    const conditions = [eq(orders.id, params.id)]
    
    // Non-admin users can only cancel their own orders
    if (session.user.role !== "admin") {
      conditions.push(eq(orders.userId, session.user.id))
    }

    const existingOrder = await db
      .select()
      .from(orders)
      .where(and(...conditions))
      .limit(1)

    if (!existingOrder[0]) {
      return NextResponse.json(
        { success: false, error: "Order not found" },
        { status: 404 }
      )
    }

    // Check if order can be cancelled
    if (existingOrder[0].status === "shipped" || existingOrder[0].status === "delivered") {
      return NextResponse.json(
        { success: false, error: "Cannot cancel shipped or delivered orders" },
        { status: 400 }
      )
    }

    if (existingOrder[0].status === "cancelled") {
      return NextResponse.json(
        { success: false, error: "Order is already cancelled" },
        { status: 400 }
      )
    }

    // Update order status to cancelled
    await db
      .update(orders)
      .set({
        status: "cancelled",
        updatedAt: new Date(),
      })
      .where(eq(orders.id, params.id))

    // TODO: Process refund if payment was completed
    // TODO: Send cancellation email

    return NextResponse.json({
      success: true,
      message: "Order cancelled successfully"
    })
  } catch (error) {
    console.error("Error cancelling order:", error)
    return NextResponse.json(
      { success: false, error: "Failed to cancel order" },
      { status: 500 }
    )
  }
}
