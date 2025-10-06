import { NextRequest, NextResponse } from 'next/server'
import { getAuthSession } from '@/lib/auth'
import { db } from '@/lib/db'
import { eq, and, desc, like, gte, count, sql } from 'drizzle-orm'
import { freeDownloads, users, books } from '@/lib/db/schema'

// GET /api/admin/free-downloads - Get free downloads with pagination and filters
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
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const search = searchParams.get('search') || ''
    const dateFilter = searchParams.get('dateFilter') || 'all'
    const bookFilter = searchParams.get('bookFilter') || 'all'

    const offset = (page - 1) * limit

    // Build date filter
    let dateCondition
    const now = new Date()
    switch (dateFilter) {
      case 'today':
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
        dateCondition = gte(freeDownloads.downloadedAt, today)
        break
      case 'week':
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        dateCondition = gte(freeDownloads.downloadedAt, weekAgo)
        break
      case 'month':
        const monthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate())
        dateCondition = gte(freeDownloads.downloadedAt, monthAgo)
        break
      case 'quarter':
        const quarterAgo = new Date(now.getFullYear(), now.getMonth() - 3, now.getDate())
        dateCondition = gte(freeDownloads.downloadedAt, quarterAgo)
        break
      default:
        dateCondition = undefined
    }

    // Build conditions array
    const conditions = []
    
    if (search) {
      conditions.push(
        sql`(${users.name} ILIKE ${`%${search}%`} OR ${users.email} ILIKE ${`%${search}%`} OR ${books.title} ILIKE ${`%${search}%`})`
      )
    }
    
    if (dateCondition) {
      conditions.push(dateCondition)
    }
    
    if (bookFilter !== 'all') {
      conditions.push(eq(freeDownloads.bookId, bookFilter))
    }

    const whereCondition = conditions.length > 0 ? and(...conditions) : undefined

    // Get downloads with user and book information
    const downloadsQuery = db
      .select({
        id: freeDownloads.id,
        userId: freeDownloads.userId,
        bookId: freeDownloads.bookId,
        bookTitle: books.title,
        bookAuthor: books.author,
        userName: users.name,
        userEmail: users.email,
        userPhone: users.phone,
        downloadedAt: freeDownloads.downloadedAt,
        ipAddress: freeDownloads.ipAddress,
        userAgent: freeDownloads.userAgent,
      })
      .from(freeDownloads)
      .innerJoin(users, eq(freeDownloads.userId, users.id))
      .innerJoin(books, eq(freeDownloads.bookId, books.id))
      .where(whereCondition)
      .orderBy(desc(freeDownloads.downloadedAt))
      .limit(limit)
      .offset(offset)

    const downloads = await downloadsQuery

    // Get total count for pagination
    const totalCountQuery = db
      .select({ count: count() })
      .from(freeDownloads)
      .innerJoin(users, eq(freeDownloads.userId, users.id))
      .innerJoin(books, eq(freeDownloads.bookId, books.id))
      .where(whereCondition)

    const [{ count: totalCount }] = await totalCountQuery

    const totalPages = Math.ceil(totalCount / limit)

    return NextResponse.json({
      success: true,
      data: {
        downloads,
        pagination: {
          page,
          limit,
          totalCount,
          pages: totalPages
        }
      }
    })

  } catch (error) {
    console.error("Error fetching free downloads:", error)
    return NextResponse.json(
      { success: false, error: "Failed to fetch downloads" },
      { status: 500 }
    )
  }
}

// POST /api/admin/free-downloads - Record a free download (called from the free book form)
export async function POST(request: NextRequest) {
  try {
    const session = await getAuthSession()
    
    if (!session) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { bookId, userId, ipAddress, userAgent } = body

    // Record the free download
    const download = await db.insert(freeDownloads).values({
      bookId,
      userId,
      downloadedAt: new Date(),
      ipAddress,
      userAgent
    }).returning()

    return NextResponse.json({
      success: true,
      data: download[0]
    })

  } catch (error) {
    console.error("Error recording free download:", error)
    return NextResponse.json(
      { success: false, error: "Failed to record download" },
      { status: 500 }
    )
  }
}
