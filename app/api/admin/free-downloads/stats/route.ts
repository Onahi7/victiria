import { NextRequest, NextResponse } from 'next/server'
import { getAuthSession } from '@/lib/auth'
import { db } from '@/lib/db'
import { eq, and, desc, gte, count, sql, countDistinct } from 'drizzle-orm'
import { freeDownloads, users, books, newsletterSubscribers } from '@/lib/db/schema'

// GET /api/admin/free-downloads/stats - Get statistics for free downloads
export async function GET(request: NextRequest) {
  try {
    const session = await getAuthSession()
    
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      )
    }

    // Get total downloads
    const [{ totalDownloads }] = await db
      .select({ totalDownloads: count() })
      .from(freeDownloads)

    // Get unique users
    const [{ uniqueUsers }] = await db
      .select({ uniqueUsers: countDistinct(freeDownloads.userId) })
      .from(freeDownloads)

    // Get total free books
    const [{ totalBooks }] = await db
      .select({ totalBooks: count() })
      .from(books)
      .where(eq(books.isFree, true))

    // Get recent downloads (last 7 days)
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    const [{ recentDownloads }] = await db
      .select({ recentDownloads: count() })
      .from(freeDownloads)
      .where(gte(freeDownloads.downloadedAt, weekAgo))

    // Get new subscribers from free downloads (last 30 days)
    const monthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    const [{ newSubscribers }] = await db
      .select({ newSubscribers: count() })
      .from(newsletterSubscribers)
      .where(
        and(
          eq(newsletterSubscribers.source, 'free_download'),
          gte(newsletterSubscribers.subscribedAt, monthAgo)
        )
      )

    // Get top downloaded books
    const topBooks = await db
      .select({
        bookId: books.id,
        title: books.title,
        author: books.author,
        downloads: count(freeDownloads.id).as('downloads')
      })
      .from(books)
      .innerJoin(freeDownloads, eq(books.id, freeDownloads.bookId))
      .where(eq(books.isFree, true))
      .groupBy(books.id, books.title, books.author)
      .orderBy(desc(sql`count(${freeDownloads.id})`))
      .limit(10)

    return NextResponse.json({
      success: true,
      data: {
        totalDownloads,
        uniqueUsers,
        totalBooks,
        recentDownloads,
        newSubscribers,
        topBooks
      }
    })

  } catch (error) {
    console.error("Error fetching free download stats:", error)
    return NextResponse.json(
      { success: false, error: "Failed to fetch stats" },
      { status: 500 }
    )
  }
}
