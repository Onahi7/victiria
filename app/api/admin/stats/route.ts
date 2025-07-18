import { NextRequest, NextResponse } from "next/server"
import { getAuthSession } from "@/lib/auth"
import { db } from "@/lib/db"
import { 
  users, 
  books, 
  orders, 
  events, 
  eventRegistrations,
  courses,
  enrollments,
  bookSubmissions,
  authorRevenues,
  blogPosts,
  reviews
} from "@/lib/db/schema"
import { eq, desc, sql, count, and, gte, between } from "drizzle-orm"

// GET /api/admin/stats - Get admin dashboard statistics
export async function GET(request: NextRequest) {
  try {
    const session = await getAuthSession()
    
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const timeRange = searchParams.get("timeRange") || "30d" // 7d, 30d, 90d, 1y
    
    const timeFilter = getTimeFilter(timeRange)

    // Get comprehensive admin statistics
    const [
      userStats,
      bookStats,
      orderStats,
      eventStats,
      courseStats,
      submissionStats,
      revenueStats,
      blogStats,
      recentActivity
    ] = await Promise.all([
      getUserStats(timeFilter),
      getBookStats(timeFilter),
      getOrderStats(timeFilter),
      getEventStats(timeFilter),
      getCourseStats(timeFilter),
      getSubmissionStats(timeFilter),
      getRevenueStats(timeFilter),
      getBlogStats(timeFilter),
      getRecentActivity()
    ])

    return NextResponse.json({
      success: true,
      data: {
        users: userStats,
        books: bookStats,
        orders: orderStats,
        events: eventStats,
        courses: courseStats,
        submissions: submissionStats,
        revenue: revenueStats,
        blog: blogStats,
        recentActivity,
        timeRange
      }
    })
  } catch (error) {
    console.error("Error fetching admin stats:", error)
    return NextResponse.json(
      { success: false, error: "Failed to fetch admin statistics" },
      { status: 500 }
    )
  }
}

function getTimeFilter(timeRange: string) {
  const now = new Date()
  const timeMap = {
    "7d": new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
    "30d": new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
    "90d": new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000),
    "1y": new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000)
  }
  
  return timeMap[timeRange as keyof typeof timeMap] || timeMap["30d"]
}

async function getUserStats(timeFilter: Date) {
  const [totalUsers, newUsers, activeUsers, usersByRole] = await Promise.all([
    // Total users
    db.select({ count: count() }).from(users),
    
    // New users in time range
    db.select({ count: count() }).from(users).where(gte(users.createdAt, timeFilter)),
    
    // Active users (those with recent orders or activity)
    db.select({ count: count() }).from(users).where(eq(users.isActive, true)),
    
    // Users by role
    db.select({
      role: users.role,
      count: count()
    }).from(users).groupBy(users.role)
  ])

  return {
    total: totalUsers[0]?.count || 0,
    new: newUsers[0]?.count || 0,
    active: activeUsers[0]?.count || 0,
    byRole: usersByRole
  }
}

async function getBookStats(timeFilter: Date) {
  const [totalBooks, newBooks, publishedBooks, booksByStatus, topBooks] = await Promise.all([
    // Total books
    db.select({ count: count() }).from(books),
    
    // New books in time range
    db.select({ count: count() }).from(books).where(gte(books.createdAt, timeFilter)),
    
    // Published books
    db.select({ count: count() }).from(books).where(eq(books.status, 'published')),
    
    // Books by status
    db.select({
      status: books.status,
      count: count()
    }).from(books).groupBy(books.status),
    
    // Top selling books
    db.select({
      id: books.id,
      title: books.title,
      author: books.author,
      salesCount: books.salesCount,
      totalRevenue: books.totalRevenue
    }).from(books).orderBy(desc(books.salesCount)).limit(5)
  ])

  return {
    total: totalBooks[0]?.count || 0,
    new: newBooks[0]?.count || 0,
    published: publishedBooks[0]?.count || 0,
    byStatus: booksByStatus,
    topSelling: topBooks
  }
}

async function getOrderStats(timeFilter: Date) {
  const [totalOrders, newOrders, completedOrders, ordersByStatus, recentOrders] = await Promise.all([
    // Total orders
    db.select({ 
      count: count(),
      totalRevenue: sql<number>`COALESCE(SUM(${orders.total}), 0)`
    }).from(orders),
    
    // New orders in time range
    db.select({ 
      count: count(),
      revenue: sql<number>`COALESCE(SUM(${orders.total}), 0)`
    }).from(orders).where(gte(orders.createdAt, timeFilter)),
    
    // Completed orders
    db.select({ count: count() }).from(orders).where(eq(orders.status, 'delivered')),
    
    // Orders by status
    db.select({
      status: orders.status,
      count: count()
    }).from(orders).groupBy(orders.status),
    
    // Recent orders
    db.select({
      id: orders.id,
      orderNumber: orders.orderNumber,
      total: orders.total,
      status: orders.status,
      createdAt: orders.createdAt,
      user: {
        name: users.name,
        email: users.email
      },
      book: {
        title: books.title
      }
    }).from(orders)
      .innerJoin(users, eq(orders.userId, users.id))
      .innerJoin(books, eq(orders.bookId, books.id))
      .orderBy(desc(orders.createdAt))
      .limit(10)
  ])

  return {
    total: totalOrders[0]?.count || 0,
    totalRevenue: totalOrders[0]?.totalRevenue || 0,
    new: newOrders[0]?.count || 0,
    newRevenue: newOrders[0]?.revenue || 0,
    completed: completedOrders[0]?.count || 0,
    byStatus: ordersByStatus,
    recent: recentOrders
  }
}

async function getEventStats(timeFilter: Date) {
  const [totalEvents, newEvents, upcomingEvents, totalRegistrations, recentEvents] = await Promise.all([
    // Total events
    db.select({ count: count() }).from(events),
    
    // New events in time range
    db.select({ count: count() }).from(events).where(gte(events.createdAt, timeFilter)),
    
    // Upcoming events
    db.select({ count: count() }).from(events).where(
      and(
        gte(events.startDate, new Date()),
        eq(events.status, 'published')
      )
    ),
    
    // Total registrations
    db.select({ count: count() }).from(eventRegistrations),
    
    // Recent events
    db.select({
      id: events.id,
      title: events.title,
      type: events.type,
      startDate: events.startDate,
      status: events.status,
      registrationCount: sql<number>`(
        SELECT COUNT(*) FROM ${eventRegistrations} 
        WHERE ${eventRegistrations.eventId} = ${events.id}
      )`
    }).from(events).orderBy(desc(events.createdAt)).limit(5)
  ])

  return {
    total: totalEvents[0]?.count || 0,
    new: newEvents[0]?.count || 0,
    upcoming: upcomingEvents[0]?.count || 0,
    totalRegistrations: totalRegistrations[0]?.count || 0,
    recent: recentEvents
  }
}

async function getCourseStats(timeFilter: Date) {
  const [totalCourses, newCourses, publishedCourses, totalEnrollments, topCourses] = await Promise.all([
    // Total courses
    db.select({ count: count() }).from(courses),
    
    // New courses in time range
    db.select({ count: count() }).from(courses).where(gte(courses.createdAt, timeFilter)),
    
    // Published courses
    db.select({ count: count() }).from(courses).where(eq(courses.isPublished, true)),
    
    // Total enrollments
    db.select({ count: count() }).from(enrollments),
    
    // Top courses by enrollment
    db.select({
      id: courses.id,
      title: courses.title,
      enrollmentCount: sql<number>`(
        SELECT COUNT(*) FROM ${enrollments} 
        WHERE ${enrollments.courseId} = ${courses.id}
      )`
    }).from(courses).orderBy(desc(sql`(
      SELECT COUNT(*) FROM ${enrollments} 
      WHERE ${enrollments.courseId} = ${courses.id}
    )`)).limit(5)
  ])

  return {
    total: totalCourses[0]?.count || 0,
    new: newCourses[0]?.count || 0,
    published: publishedCourses[0]?.count || 0,
    totalEnrollments: totalEnrollments[0]?.count || 0,
    topCourses: topCourses
  }
}

async function getSubmissionStats(timeFilter: Date) {
  const [totalSubmissions, newSubmissions, submissionsByStatus, recentSubmissions] = await Promise.all([
    // Total submissions
    db.select({ count: count() }).from(bookSubmissions),
    
    // New submissions in time range
    db.select({ count: count() }).from(bookSubmissions).where(gte(bookSubmissions.createdAt, timeFilter)),
    
    // Submissions by status
    db.select({
      status: bookSubmissions.status,
      count: count()
    }).from(bookSubmissions).groupBy(bookSubmissions.status),
    
    // Recent submissions
    db.select({
      id: bookSubmissions.id,
      title: bookSubmissions.title,
      status: bookSubmissions.status,
      submittedAt: bookSubmissions.submittedAt,
      author: {
        name: users.name,
        email: users.email
      }
    }).from(bookSubmissions)
      .innerJoin(users, eq(bookSubmissions.authorId, users.id))
      .orderBy(desc(bookSubmissions.createdAt))
      .limit(10)
  ])

  return {
    total: totalSubmissions[0]?.count || 0,
    new: newSubmissions[0]?.count || 0,
    byStatus: submissionsByStatus,
    recent: recentSubmissions
  }
}

async function getRevenueStats(timeFilter: Date) {
  const [totalRevenue, periodRevenue, authorRevenue, platformRevenue] = await Promise.all([
    // Total revenue from orders
    db.select({
      total: sql<number>`COALESCE(SUM(${orders.total}), 0)`
    }).from(orders).where(eq(orders.paymentStatus, 'completed')),
    
    // Revenue in time period
    db.select({
      total: sql<number>`COALESCE(SUM(${orders.total}), 0)`
    }).from(orders).where(
      and(
        eq(orders.paymentStatus, 'completed'),
        gte(orders.createdAt, timeFilter)
      )
    ),
    
    // Author revenue
    db.select({
      total: sql<number>`COALESCE(SUM(${authorRevenues.authorEarning}), 0)`
    }).from(authorRevenues),
    
    // Platform revenue (fees)
    db.select({
      total: sql<number>`COALESCE(SUM(${authorRevenues.platformFee}), 0)`
    }).from(authorRevenues)
  ])

  return {
    total: totalRevenue[0]?.total || 0,
    period: periodRevenue[0]?.total || 0,
    authorEarnings: authorRevenue[0]?.total || 0,
    platformFees: platformRevenue[0]?.total || 0
  }
}

async function getBlogStats(timeFilter: Date) {
  const [totalPosts, newPosts, publishedPosts, recentPosts] = await Promise.all([
    // Total blog posts
    db.select({ count: count() }).from(blogPosts),
    
    // New posts in time range
    db.select({ count: count() }).from(blogPosts).where(gte(blogPosts.createdAt, timeFilter)),
    
    // Published posts
    db.select({ count: count() }).from(blogPosts).where(eq(blogPosts.status, 'published')),
    
    // Recent posts
    db.select({
      id: blogPosts.id,
      title: blogPosts.title,
      status: blogPosts.status,
      publishedAt: blogPosts.publishedAt,
      author: {
        name: users.name
      }
    }).from(blogPosts)
      .innerJoin(users, eq(blogPosts.authorId, users.id))
      .orderBy(desc(blogPosts.createdAt))
      .limit(5)
  ])

  return {
    total: totalPosts[0]?.count || 0,
    new: newPosts[0]?.count || 0,
    published: publishedPosts[0]?.count || 0,
    recent: recentPosts
  }
}

async function getRecentActivity() {
  // Get mixed recent activity from multiple sources
  const [recentOrders, recentRegistrations, recentSubmissions, recentReviews] = await Promise.all([
    // Recent orders
    db.select({
      type: sql<string>`'order'`,
      id: orders.id,
      description: sql<string>`'New order: ' || ${orders.orderNumber}`,
      createdAt: orders.createdAt,
      user: users.name
    }).from(orders)
      .innerJoin(users, eq(orders.userId, users.id))
      .orderBy(desc(orders.createdAt))
      .limit(5),
    
    // Recent event registrations
    db.select({
      type: sql<string>`'registration'`,
      id: eventRegistrations.id,
      description: sql<string>`'Event registration: ' || ${events.title}`,
      createdAt: eventRegistrations.registeredAt,
      user: users.name
    }).from(eventRegistrations)
      .innerJoin(events, eq(eventRegistrations.eventId, events.id))
      .innerJoin(users, eq(eventRegistrations.userId, users.id))
      .orderBy(desc(eventRegistrations.registeredAt))
      .limit(5),
    
    // Recent submissions
    db.select({
      type: sql<string>`'submission'`,
      id: bookSubmissions.id,
      description: sql<string>`'Book submission: ' || ${bookSubmissions.title}`,
      createdAt: bookSubmissions.createdAt,
      user: users.name
    }).from(bookSubmissions)
      .innerJoin(users, eq(bookSubmissions.authorId, users.id))
      .orderBy(desc(bookSubmissions.createdAt))
      .limit(5),
    
    // Recent reviews
    db.select({
      type: sql<string>`'review'`,
      id: reviews.id,
      description: sql<string>`'Book review: ' || ${books.title}`,
      createdAt: reviews.createdAt,
      user: users.name
    }).from(reviews)
      .innerJoin(users, eq(reviews.userId, users.id))
      .innerJoin(books, eq(reviews.bookId, books.id))
      .orderBy(desc(reviews.createdAt))
      .limit(5)
  ])

  // Combine and sort all activities
  const allActivities = [
    ...recentOrders,
    ...recentRegistrations,
    ...recentSubmissions,
    ...recentReviews
  ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

  return allActivities.slice(0, 15)
}
