import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { bookPreorders, books, preorderPurchases } from '@/lib/db/schema'
import { eq, and, gte, lte, sql } from 'drizzle-orm'

// GET - Get all preorders (admin) or active preorders (public)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const session = await getServerSession(authOptions)
    const isAdmin = session?.user?.role === 'admin'
    
    const status = searchParams.get('status')
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = parseInt(searchParams.get('offset') || '0')

    let whereConditions: any[] = []

    if (!isAdmin) {
      // Public API - only show active preorders
      whereConditions.push(
        and(
          eq(bookPreorders.isActive, true),
          lte(bookPreorders.preorderStart, new Date()),
          gte(bookPreorders.preorderEnd, new Date())
        )
      )
    } else {
      // Admin API - filter by status
      if (status === 'active') {
        whereConditions.push(
          and(
            eq(bookPreorders.isActive, true),
            lte(bookPreorders.preorderStart, new Date()),
            gte(bookPreorders.preorderEnd, new Date())
          )
        )
      } else if (status === 'upcoming') {
        whereConditions.push(
          and(
            eq(bookPreorders.isActive, true),
            gte(bookPreorders.preorderStart, new Date())
          )
        )
      } else if (status === 'ended') {
        whereConditions.push(
          lte(bookPreorders.preorderEnd, new Date())
        )
      }
    }

    let query = db
      .select({
        preorder: bookPreorders,
        book: {
          id: books.id,
          title: books.title,
          coverImage: books.coverImage,
          price: books.price,
          author: books.author
        }
      })
      .from(bookPreorders)
      .leftJoin(books, eq(bookPreorders.bookId, books.id))

    let results
    if (whereConditions.length > 0) {
      results = await query
        .where(and(...whereConditions))
        .orderBy(sql`${bookPreorders.createdAt} DESC`)
        .limit(limit)
        .offset(offset)
    } else {
      results = await query
        .orderBy(sql`${bookPreorders.createdAt} DESC`)
        .limit(limit)
        .offset(offset)
    }

    return NextResponse.json({
      success: true,
      data: results
    })

  } catch (error) {
    console.error('Error fetching preorders:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST - Create new preorder (admin only)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const {
      bookId,
      preorderStart,
      preorderEnd,
      releaseDate,
      earlyAccessDiscount,
      maxPreorderQuantity,
      preorderBenefits
    } = body

    // Validate required fields
    if (!bookId || !preorderStart || !preorderEnd || !releaseDate) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Validate dates
    const startDate = new Date(preorderStart)
    const endDate = new Date(preorderEnd)
    const releaseDateObj = new Date(releaseDate)

    if (startDate >= endDate) {
      return NextResponse.json(
        { success: false, error: 'Preorder start date must be before end date' },
        { status: 400 }
      )
    }

    if (endDate >= releaseDateObj) {
      return NextResponse.json(
        { success: false, error: 'Preorder end date must be before release date' },
        { status: 400 }
      )
    }

    // Check if book exists
    const [book] = await db
      .select()
      .from(books)
      .where(eq(books.id, bookId))
      .limit(1)

    if (!book) {
      return NextResponse.json(
        { success: false, error: 'Book not found' },
        { status: 404 }
      )
    }

    // Check if preorder already exists for this book
    const [existingPreorder] = await db
      .select()
      .from(bookPreorders)
      .where(eq(bookPreorders.bookId, bookId))
      .limit(1)

    if (existingPreorder) {
      return NextResponse.json(
        { success: false, error: 'Preorder already exists for this book' },
        { status: 400 }
      )
    }

    // Create preorder
    const [newPreorder] = await db
      .insert(bookPreorders)
      .values({
        bookId,
        preorderStart: startDate,
        preorderEnd: endDate,
        releaseDate: releaseDateObj,
        earlyAccessDiscount: earlyAccessDiscount?.toString() || '0',
        maxPreorderQuantity,
        preorderBenefits,
      })
      .returning()

    return NextResponse.json({
      success: true,
      data: newPreorder,
      message: 'Preorder created successfully'
    })

  } catch (error) {
    console.error('Error creating preorder:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
