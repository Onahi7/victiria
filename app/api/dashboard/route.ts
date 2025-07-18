import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { 
  orders, 
  books, 
  readingProgress, 
  reviews, 
  wishlists,
  blogPosts,
  userPreferences 
} from "@/lib/db/schema"
import { eq, desc, sql, count, and } from "drizzle-orm"

// GET /api/dashboard - Get comprehensive dashboard data
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
    const section = searchParams.get("section") // 'overview', 'orders', 'reading', 'reviews', 'wishlist'

    if (section) {
      // Return specific section data
      const sectionData = await getDashboardSection(session.user.id, section)
      return NextResponse.json({
        success: true,
        data: sectionData
      })
    }

    // Get complete dashboard data
    const [
      overview,
      recentOrders,
      currentlyReading,
      recentReviews,
      wishlistItems,
      readingStats,
      preferences
    ] = await Promise.all([
      getOverviewStats(session.user.id),
      getRecentOrders(session.user.id, 5),
      getCurrentlyReading(session.user.id, 3),
      getRecentReviews(session.user.id, 3),
      getWishlistItems(session.user.id, 5),
      getReadingStatistics(session.user.id),
      getUserPreferences(session.user.id)
    ])

    return NextResponse.json({
      success: true,
      data: {
        overview,
        recentOrders,
        currentlyReading,
        recentReviews,
        wishlistItems,
        readingStats,
        preferences,
        user: {
          id: session.user.id,
          name: session.user.name,
          email: session.user.email,
          role: session.user.role,
        }
      }
    })
  } catch (error) {
    console.error("Error fetching dashboard data:", error)
    return NextResponse.json(
      { success: false, error: "Failed to fetch dashboard data" },
      { status: 500 }
    )
  }
}

async function getDashboardSection(userId: string, section: string) {
  switch (section) {
    case 'overview':
      return getOverviewStats(userId)
    
    case 'orders':
      return getRecentOrders(userId, 20)
    
    case 'reading':
      return {
        currentlyReading: await getCurrentlyReading(userId, 10),
        statistics: await getReadingStatistics(userId)
      }
    
    case 'reviews':
      return getRecentReviews(userId, 20)
    
    case 'wishlist':
      return getWishlistItems(userId, 20)
    
    default:
      throw new Error(`Unknown section: ${section}`)
  }
}

async function getOverviewStats(userId: string) {
  const [orderStats, readingStats, reviewStats, wishlistStats] = await Promise.all([
    // Order statistics
    db
      .select({
        totalOrders: count(),
        totalSpent: sql<number>`COALESCE(SUM(${orders.total}), 0)`,
        completedOrders: sql<number>`COUNT(CASE WHEN ${orders.status} = 'delivered' THEN 1 END)`,
        pendingOrders: sql<number>`COUNT(CASE WHEN ${orders.status} = 'pending' THEN 1 END)`,
      })
      .from(orders)
      .where(eq(orders.userId, userId)),

    // Reading statistics
    db
      .select({
        totalBooks: count(),
        completedBooks: sql<number>`COUNT(CASE WHEN ${readingProgress.isCompleted} = true THEN 1 END)`,
        currentlyReading: sql<number>`COUNT(CASE WHEN ${readingProgress.isCompleted} = false THEN 1 END)`,
        averageProgress: sql<number>`ROUND(AVG(${readingProgress.percentage}), 1)`,
      })
      .from(readingProgress)
      .where(eq(readingProgress.userId, userId)),

    // Review statistics
    db
      .select({
        totalReviews: count(),
        averageRating: sql<number>`ROUND(AVG(${reviews.rating}), 1)`,
      })
      .from(reviews)
      .where(eq(reviews.userId, userId)),

    // Wishlist statistics
    db
      .select({
        totalWishlistItems: count(),
      })
      .from(wishlists)
      .where(eq(wishlists.userId, userId))
  ])

  return {
    orders: orderStats[0] || { totalOrders: 0, totalSpent: 0, completedOrders: 0, pendingOrders: 0 },
    reading: readingStats[0] || { totalBooks: 0, completedBooks: 0, currentlyReading: 0, averageProgress: 0 },
    reviews: reviewStats[0] || { totalReviews: 0, averageRating: 0 },
    wishlist: wishlistStats[0] || { totalWishlistItems: 0 },
  }
}

async function getRecentOrders(userId: string, limit: number) {
  return db
    .select({
      id: orders.id,
      orderNumber: orders.orderNumber,
      status: orders.status,
      total: orders.total,
      paymentStatus: orders.paymentStatus,
      createdAt: orders.createdAt,
      book: {
        id: books.id,
        title: books.title,
        author: books.author,
        coverImage: books.coverImage,
      }
    })
    .from(orders)
    .innerJoin(books, eq(orders.bookId, books.id))
    .where(eq(orders.userId, userId))
    .orderBy(desc(orders.createdAt))
    .limit(limit)
}

async function getCurrentlyReading(userId: string, limit: number) {
  return db
    .select({
      id: readingProgress.id,
      currentPage: readingProgress.currentPage,
      totalPages: readingProgress.totalPages,
      percentage: readingProgress.percentage,
      lastReadAt: readingProgress.lastReadAt,
      notes: readingProgress.notes,
      book: {
        id: books.id,
        title: books.title,
        author: books.author,
        coverImage: books.coverImage,
      }
    })
    .from(readingProgress)
    .innerJoin(books, eq(readingProgress.bookId, books.id))
    .where(and(
      eq(readingProgress.userId, userId),
      eq(readingProgress.isCompleted, false)
    ))
    .orderBy(desc(readingProgress.lastReadAt))
    .limit(limit)
}

async function getRecentReviews(userId: string, limit: number) {
  return db
    .select({
      id: reviews.id,
      rating: reviews.rating,
      comment: reviews.comment,
      isVerifiedPurchase: reviews.isVerifiedPurchase,
      createdAt: reviews.createdAt,
      book: {
        id: books.id,
        title: books.title,
        author: books.author,
        coverImage: books.coverImage,
      }
    })
    .from(reviews)
    .innerJoin(books, eq(reviews.bookId, books.id))
    .where(eq(reviews.userId, userId))
    .orderBy(desc(reviews.createdAt))
    .limit(limit)
}

async function getWishlistItems(userId: string, limit: number) {
  return db
    .select({
      id: wishlists.id,
      addedAt: wishlists.addedAt,
      book: {
        id: books.id,
        title: books.title,
        author: books.author,
        price: books.price,
        coverImage: books.coverImage,
        isAvailable: books.isAvailable,
      }
    })
    .from(wishlists)
    .innerJoin(books, eq(wishlists.bookId, books.id))
    .where(eq(wishlists.userId, userId))
    .orderBy(desc(wishlists.addedAt))
    .limit(limit)
}

async function getReadingStatistics(userId: string) {
  const [monthlyProgress, genreStats, readingStreak] = await Promise.all([
    // Monthly reading progress (last 6 months)
    db
      .select({
        month: sql<string>`TO_CHAR(${readingProgress.completedAt}, 'YYYY-MM')`,
        booksCompleted: count(),
      })
      .from(readingProgress)
      .where(and(
        eq(readingProgress.userId, userId),
        eq(readingProgress.isCompleted, true),
        sql`${readingProgress.completedAt} >= NOW() - INTERVAL '6 months'`
      ))
      .groupBy(sql`TO_CHAR(${readingProgress.completedAt}, 'YYYY-MM')`)
      .orderBy(sql`TO_CHAR(${readingProgress.completedAt}, 'YYYY-MM')`),

    // Reading by genre (from completed books)
    db
      .select({
        category: books.category,
        count: count(),
      })
      .from(readingProgress)
      .innerJoin(books, eq(readingProgress.bookId, books.id))
      .where(and(
        eq(readingProgress.userId, userId),
        eq(readingProgress.isCompleted, true)
      ))
      .groupBy(books.category)
      .orderBy(desc(count())),

    // Reading streak (days with reading activity)
    db
      .select({
        streak: sql<number>`COUNT(DISTINCT DATE(${readingProgress.lastReadAt}))`
      })
      .from(readingProgress)
      .where(and(
        eq(readingProgress.userId, userId),
        sql`${readingProgress.lastReadAt} >= NOW() - INTERVAL '30 days'`
      ))
  ])

  return {
    monthlyProgress,
    genreStats,
    currentStreak: readingStreak[0]?.streak || 0,
  }
}

async function getUserPreferences(userId: string) {
  const preferences = await db
    .select()
    .from(userPreferences)
    .where(eq(userPreferences.userId, userId))
    .limit(1)

  return preferences[0] || null
}
