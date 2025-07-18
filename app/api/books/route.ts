import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { books, users, reviews } from '@/lib/db/schema'
import { withCache, CacheStrategies, CacheInvalidation } from '@/lib/cache/middleware'
import { withErrorTracking } from '@/lib/monitoring/error-tracker'
import { withPerformanceTracking, trackDbQuery } from '@/lib/monitoring/performance'
import CacheService, { CACHE_CONFIG } from '@/lib/cache/redis'
import { desc, asc, count, like, ilike, eq, and, sql } from 'drizzle-orm'

// GET all books with filtering and caching
async function getBooksHandler(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get("category")
    const search = searchParams.get("search")
    const status = searchParams.get("status") || "published"
    const page = parseInt(searchParams.get("page") || "1")
    const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 100) // Max 100 items
    const sortBy = searchParams.get("sortBy") || "createdAt"
    const sortOrder = searchParams.get("sortOrder") || "desc"

    // Generate cache key based on query parameters
    const cacheKey = `${CACHE_CONFIG.KEYS.BOOK}list:${JSON.stringify({
      category, search, status, page, limit, sortBy, sortOrder
    })}`

    // Try to get from cache first
    const cached = await CacheService.get(cacheKey)
    if (cached) {
      return NextResponse.json({
        success: true,
        data: cached,
        cached: true,
        timestamp: Date.now()
      })
    }

    // Build where conditions
    const skip = (page - 1) * limit
    const whereConditions = []
    
    if (status && status !== "all") {
      whereConditions.push(eq(books.status, status.toLowerCase()))
    }

    if (category && category !== "All Books") {
      whereConditions.push(eq(books.category, category))
    }

    if (search) {
      whereConditions.push(
        sql`(${ilike(books.title, `%${search}%`)} OR ${ilike(books.description, `%${search}%`)} OR ${ilike(books.author, `%${search}%`)})`
      )
    }

    const whereClause = whereConditions.length > 0 ? and(...whereConditions) : undefined

    // Get books with pagination
    const [allBooks, totalCountResult] = await Promise.all([
      trackDbQuery(
        'books.findMany',
        () => db.select({
          id: books.id,
          title: books.title,
          author: books.author,
          description: books.description,
          price: books.price,
          coverImage: books.coverImage,
          status: books.status,
          category: books.category,
          tags: books.tags,
          isbn: books.isbn,
          createdAt: books.createdAt,
          updatedAt: books.updatedAt
        })
        .from(books)
        .where(whereClause)
        .orderBy(sortOrder === 'desc' ? desc(books[sortBy]) : asc(books[sortBy]))
        .limit(limit)
        .offset(skip)
      ),
      trackDbQuery(
        'books.count',
        () => db.select({ count: count() }).from(books).where(whereClause)
      )
    ])

    const totalCount = totalCountResult[0]?.count || 0

    // Add metadata for each book
    const booksWithMetadata = await Promise.all(
      allBooks.map(async (book) => {
        // Get average rating
        const avgRatingResult = await trackDbQuery(
          'reviews.aggregate',
          () => db.select({ 
            avgRating: sql<number>`AVG(${reviews.rating})`,
            reviewCount: count()
          })
          .from(reviews)
          .where(eq(reviews.bookId, book.id))
        )

        const avgRating = avgRatingResult[0]?.avgRating || 0
        const reviewCount = avgRatingResult[0]?.reviewCount || 0

        return {
          ...book,
          averageRating: Number(avgRating),
          reviewCount,
          salesCount: 0, // TODO: implement when orders are fixed
          isPopular: false, // TODO: implement based on sales
          tags: book.tags || []
        }
      })
    )

    const result = {
      books: booksWithMetadata,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit),
        hasNextPage: page < Math.ceil(totalCount / limit),
        hasPrevPage: page > 1
      },
      filters: {
        category,
        search,
        status,
        sortBy,
        sortOrder
      }
    }

    // Cache the result
    await CacheService.set(cacheKey, result, CACHE_CONFIG.TTL.LONG)
    
    return NextResponse.json({
      success: true,
      data: result,
      cached: false,
      timestamp: Date.now()
    })
  } catch (error) {
    console.error('Error fetching books:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch books' },
      { status: 500 }
    )
  }
}

const bookSchema = z.object({
  title: z.string().min(1, "Title is required").max(200, "Title too long"),
  description: z.string().min(10, "Description must be at least 10 characters").max(2000, "Description too long"),
  price: z.number().min(0, "Price must be positive").max(1000000, "Price too high"),
  coverImage: z.string().url().optional(),
  category: z.string().min(1, "Category is required"),
  status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]).default("DRAFT"),
  tags: z.array(z.string()).optional(),
  isbn: z.string().optional(),
  publisher: z.string().optional(),
  publishedYear: z.number().optional(),
  pageCount: z.number().optional(),
  language: z.string().default("English")
})

// POST create new book (admin only)
async function createBookHandler(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json(
        { success: false, error: "Unauthorized. Admin access required." },
        { status: 401 }
      )
    }

    const body = await request.json()
    const bookData = bookSchema.parse(body)

    // Check for duplicate titles
    const existingBook = await trackDbQuery(
      'books.findFirst.duplicate',
      () => db.select().from(books).where(
        and(
          eq(books.title, bookData.title),
          sql`${books.status} != 'archived'`
        )
      ).limit(1)
    )

    if (existingBook.length > 0) {
      return NextResponse.json(
        { success: false, error: "A book with this title already exists" },
        { status: 409 }
      )
    }

    const newBook = await trackDbQuery(
      'books.create',
      () => db.insert(books).values({
        ...bookData,
        tags: bookData.tags ? JSON.stringify(bookData.tags) : null,
        createdAt: new Date(),
        updatedAt: new Date()
      }).returning()
    )

    // Invalidate relevant caches
    await CacheInvalidation.invalidateResource('book', newBook[0].id)
    await CacheInvalidation.invalidateSearch()

    return NextResponse.json({
      success: true,
      data: newBook[0],
      message: "Book created successfully"
    }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: "Invalid input", details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error creating book:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create book' },
      { status: 500 }
    )
  }
}

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9 -]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim()
}

// Apply middleware to handlers
export const GET = withErrorTracking(
  withPerformanceTracking(
    withCache(getBooksHandler, CacheStrategies.BOOKS)
  )
)

export const POST = withErrorTracking(
  withPerformanceTracking(createBookHandler)
)
