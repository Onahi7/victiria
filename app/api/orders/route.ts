import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { orders, books, users } from "@/lib/db/schema"
import { eq, desc, and, like, or } from "drizzle-orm"

const createOrderSchema = z.object({
  bookId: z.string().min(1, "Book ID is required"),
  paymentMethod: z.enum(["paystack", "flutterwave", "bank_transfer"]),
  shippingAddress: z.object({
    street: z.string().min(1, "Street is required"),
    city: z.string().min(1, "City is required"),
    state: z.string().min(1, "State is required"),
    country: z.string().min(1, "Country is required"),
    postalCode: z.string().min(1, "Postal code is required"),
  }),
  billingAddress: z.object({
    street: z.string().min(1, "Street is required"),
    city: z.string().min(1, "City is required"),
    state: z.string().min(1, "State is required"),
    country: z.string().min(1, "Country is required"),
    postalCode: z.string().min(1, "Postal code is required"),
  }).optional(),
  notes: z.string().optional(),
})

const updateOrderSchema = z.object({
  status: z.enum(["pending", "confirmed", "processing", "shipped", "delivered", "cancelled"]).optional(),
  trackingNumber: z.string().optional(),
  notes: z.string().optional(),
})

// GET /api/orders - Get orders (with filtering)
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status")
    const search = searchParams.get("search")
    const limit = parseInt(searchParams.get("limit") || "10")
    const offset = parseInt(searchParams.get("offset") || "0")

    // Build base query - admin sees all orders, users see only their own
    let query = db
      .select({
        id: orders.id,
        orderNumber: orders.orderNumber,
        status: orders.status,
        total: orders.total,
        createdAt: orders.createdAt,
        updatedAt: orders.updatedAt,
        trackingNumber: orders.trackingNumber,
        book: {
          id: books.id,
          title: books.title,
          price: books.price,
          coverImage: books.coverImage,
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
      query = query.innerJoin(users, eq(orders.userId, users.id))
    }

    // Build where conditions
    const conditions = []
    
    // Non-admin users can only see their own orders
    if (session.user.role !== "admin") {
      conditions.push(eq(orders.userId, session.user.id))
    }
    
    if (status) {
      conditions.push(eq(orders.status, status as any))
    }
    
    if (search) {
      conditions.push(
        or(
          like(orders.orderNumber, `%${search}%`),
          like(books.title, `%${search}%`)
        )
      )
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions))
    }

    const ordersList = await query
      .orderBy(desc(orders.createdAt))
      .limit(limit)
      .offset(offset)

    return NextResponse.json({
      success: true,
      data: {
        orders: ordersList,
        pagination: {
          limit,
          offset,
          hasMore: ordersList.length === limit
        }
      }
    })
  } catch (error) {
    console.error("Error fetching orders:", error)
    return NextResponse.json(
      { success: false, error: "Failed to fetch orders" },
      { status: 500 }
    )
  }
}

// POST /api/orders - Create new order
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
    const orderData = createOrderSchema.parse(body)

    // Verify book exists and get price
    const book = await db
      .select()
      .from(books)
      .where(eq(books.id, orderData.bookId))
      .limit(1)

    if (!book[0]) {
      return NextResponse.json(
        { success: false, error: "Book not found" },
        { status: 404 }
      )
    }

    if (!book[0].isAvailable) {
      return NextResponse.json(
        { success: false, error: "Book is not available for purchase" },
        { status: 400 }
      )
    }

    // Generate order number
    const orderNumber = generateOrderNumber()

    // Calculate total (you might want to add shipping, tax, etc.)
    const total = book[0].price

    // Use billing address if not provided
    const billingAddress = orderData.billingAddress || orderData.shippingAddress

    const newOrder = await db.insert(orders)
      .values({
        orderNumber,
        userId: session.user.id,
        bookId: orderData.bookId,
        status: "pending",
        total,
        paymentMethod: orderData.paymentMethod,
        shippingAddress: orderData.shippingAddress,
        billingAddress,
        notes: orderData.notes,
      })
      .returning()

    // TODO: Integrate with payment provider (Paystack/Flutterwave)
    // TODO: Send order confirmation email

    return NextResponse.json({
      success: true,
      data: newOrder[0],
      message: "Order created successfully"
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: "Invalid input", details: error.errors },
        { status: 400 }
      )
    }

    console.error("Error creating order:", error)
    return NextResponse.json(
      { success: false, error: "Failed to create order" },
      { status: 500 }
    )
  }
}

// Helper function to generate unique order number
function generateOrderNumber(): string {
  const timestamp = Date.now().toString()
  const random = Math.random().toString(36).substring(2, 8).toUpperCase()
  return `ORD-${timestamp.slice(-6)}${random}`
}
