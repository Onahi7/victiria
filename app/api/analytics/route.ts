import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { users, books, blogPosts, orders } from "@/lib/db/schema"
import { eq, sql, desc, count } from "drizzle-orm"

// GET /api/analytics - Get dashboard analytics (admin only)
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session || session.user.role !== "admin") {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const period = searchParams.get("period") || "30d" // 7d, 30d, 90d, 1y

    // Calculate date range based on period
    const now = new Date()
    let startDate = new Date()
    
    switch (period) {
      case "7d":
        startDate.setDate(now.getDate() - 7)
        break
      case "30d":
        startDate.setDate(now.getDate() - 30)
        break
      case "90d":
        startDate.setDate(now.getDate() - 90)
        break
      case "1y":
        startDate.setFullYear(now.getFullYear() - 1)
        break
    }

    // Get total counts
    const [totalUsers] = await db.select({ count: count() }).from(users)
    const [totalBooks] = await db.select({ count: count() }).from(books)
    const [totalBlogPosts] = await db.select({ count: count() }).from(blogPosts)
    const [totalOrders] = await db.select({ count: count() }).from(orders)

    // Get recent users (for period)
    const [recentUsers] = await db
      .select({ count: count() })
      .from(users)
      .where(sql`${users.createdAt} >= ${startDate}`)

    // Get published blog posts
    const [publishedPosts] = await db
      .select({ count: count() })
      .from(blogPosts)
      .where(eq(blogPosts.status, "published"))

    // Get orders analytics
    const ordersAnalytics = await db
      .select({
        status: orders.status,
        count: count(),
        total: sql<number>`COALESCE(SUM(${orders.total}), 0)`
      })
      .from(orders)
      .groupBy(orders.status)

    // Get recent orders for the period
    const [recentOrdersCount] = await db
      .select({ count: count() })
      .from(orders)
      .where(sql`${orders.createdAt} >= ${startDate}`)

    const [recentRevenue] = await db
      .select({ 
        total: sql<number>`COALESCE(SUM(${orders.total}), 0)`
      })
      .from(orders)
      .where(sql`${orders.createdAt} >= ${startDate} AND ${orders.status} = 'completed'`)

    // Get top performing books
    const topBooks = await db
      .select({
        id: books.id,
        title: books.title,
        price: books.price,
        sales: sql<number>`COALESCE(COUNT(${orders.id}), 0)`
      })
      .from(books)
      .leftJoin(orders, eq(books.id, orders.bookId))
      .groupBy(books.id, books.title, books.price)
      .orderBy(desc(sql`COALESCE(COUNT(${orders.id}), 0)`))
      .limit(5)

    // Get user registration trends (last 7 days)
    const userTrends = await db
      .select({
        date: sql<string>`DATE(${users.createdAt})`,
        count: count()
      })
      .from(users)
      .where(sql`${users.createdAt} >= ${new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)}`)
      .groupBy(sql`DATE(${users.createdAt})`)
      .orderBy(sql`DATE(${users.createdAt})`)

    // Get revenue trends (last 7 days)
    const revenueTrends = await db
      .select({
        date: sql<string>`DATE(${orders.createdAt})`,
        revenue: sql<number>`COALESCE(SUM(${orders.total}), 0)`,
        orders: count()
      })
      .from(orders)
      .where(sql`${orders.createdAt} >= ${new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)} AND ${orders.status} = 'completed'`)
      .groupBy(sql`DATE(${orders.createdAt})`)
      .orderBy(sql`DATE(${orders.createdAt})`)

    const analytics = {
      overview: {
        totalUsers: totalUsers.count,
        totalBooks: totalBooks.count,
        totalBlogPosts: totalBlogPosts.count,
        publishedPosts: publishedPosts.count,
        totalOrders: totalOrders.count,
        recentUsers: recentUsers.count,
        recentOrders: recentOrdersCount.count,
        recentRevenue: recentRevenue.total || 0
      },
      orders: {
        byStatus: ordersAnalytics.reduce((acc, order) => {
          acc[order.status] = {
            count: order.count,
            total: order.total
          }
          return acc
        }, {} as Record<string, { count: number; total: number }>)
      },
      topBooks,
      trends: {
        users: userTrends,
        revenue: revenueTrends
      },
      period
    }

    return NextResponse.json({
      success: true,
      data: analytics
    })
  } catch (error) {
    console.error("Error fetching analytics:", error)
    return NextResponse.json(
      { success: false, error: "Failed to fetch analytics" },
      { status: 500 }
    )
  }
}
