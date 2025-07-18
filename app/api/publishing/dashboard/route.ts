import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { 
  authorProfiles, 
  bookSubmissions, 
  books, 
  authorRevenues, 
  authorPayouts,
  authorMessages 
} from '@/lib/db/schema'
import { eq, and, sql, sum, count } from 'drizzle-orm'

// GET author dashboard data
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session) {
      return NextResponse.json(
        { success: false, error: "Authentication required" },
        { status: 401 }
      )
    }

    // Get author profile
    const authorProfile = await db
      .select()
      .from(authorProfiles)
      .where(eq(authorProfiles.userId, session.user.id))
      .limit(1)

    // Get submission statistics
    const submissionStats = await db
      .select({
        status: bookSubmissions.status,
        count: count(),
      })
      .from(bookSubmissions)
      .where(eq(bookSubmissions.authorId, session.user.id))
      .groupBy(bookSubmissions.status)

    // Get published books count
    const publishedBooksCount = await db
      .select({ count: count() })
      .from(books)
      .where(
        and(
          eq(books.authorId, session.user.id),
          eq(books.status, 'published')
        )
      )

    // Get revenue summary
    const revenueStats = await db
      .select({
        totalEarnings: sum(authorRevenues.authorEarning),
        totalSales: count(),
      })
      .from(authorRevenues)
      .where(eq(authorRevenues.authorId, session.user.id))

    // Get pending payout amount
    const pendingPayouts = await db
      .select({
        totalPending: sum(authorPayouts.amount),
      })
      .from(authorPayouts)
      .where(
        and(
          eq(authorPayouts.authorId, session.user.id),
          eq(authorPayouts.status, 'pending')
        )
      )

    // Get unread messages count
    const unreadMessages = await db
      .select({ count: count() })
      .from(authorMessages)
      .where(
        and(
          eq(authorMessages.authorId, session.user.id),
          eq(authorMessages.isRead, false),
          eq(authorMessages.isFromAuthor, false) // Messages from admin
        )
      )

    // Get recent submissions
    const recentSubmissions = await db
      .select({
        id: bookSubmissions.id,
        title: bookSubmissions.title,
        status: bookSubmissions.status,
        submittedAt: bookSubmissions.submittedAt,
        reviewedAt: bookSubmissions.reviewedAt,
        createdAt: bookSubmissions.createdAt,
      })
      .from(bookSubmissions)
      .where(eq(bookSubmissions.authorId, session.user.id))
      .orderBy(sql`${bookSubmissions.createdAt} DESC`)
      .limit(5)

    // Get recent revenue
    const recentRevenue = await db
      .select({
        id: authorRevenues.id,
        bookId: authorRevenues.bookId,
        saleAmount: authorRevenues.saleAmount,
        authorEarning: authorRevenues.authorEarning,
        createdAt: authorRevenues.createdAt,
        book: {
          title: books.title,
        }
      })
      .from(authorRevenues)
      .leftJoin(books, eq(authorRevenues.bookId, books.id))
      .where(eq(authorRevenues.authorId, session.user.id))
      .orderBy(sql`${authorRevenues.createdAt} DESC`)
      .limit(10)

    // Process submission statistics
    const submissionStatMap = submissionStats.reduce((acc, stat) => {
      acc[stat.status] = stat.count
      return acc
    }, {} as Record<string, number>)

    const dashboardData = {
      profile: authorProfile[0] || null,
      statistics: {
        submissions: {
          total: submissionStats.reduce((sum, stat) => sum + stat.count, 0),
          draft: submissionStatMap.draft || 0,
          submitted: submissionStatMap.submitted || 0,
          under_review: submissionStatMap.under_review || 0,
          approved: submissionStatMap.approved || 0,
          rejected: submissionStatMap.rejected || 0,
          published: submissionStatMap.published || 0,
        },
        books: {
          published: publishedBooksCount[0]?.count || 0,
        },
        revenue: {
          totalEarnings: parseFloat(revenueStats[0]?.totalEarnings || '0'),
          totalSales: revenueStats[0]?.totalSales || 0,
          pendingPayouts: parseFloat(pendingPayouts[0]?.totalPending || '0'),
        },
        messages: {
          unread: unreadMessages[0]?.count || 0,
        }
      },
      recentActivity: {
        submissions: recentSubmissions,
        revenue: recentRevenue,
      }
    }

    return NextResponse.json({
      success: true,
      data: dashboardData,
    })

  } catch (error) {
    console.error('Error fetching author dashboard:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch dashboard data' },
      { status: 500 }
    )
  }
}
