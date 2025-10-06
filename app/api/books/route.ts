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
      // Validate status against allowed enum values
      const allowedStatuses = ["published", "draft", "pending_review", "approved", "rejected", "archived"]
      const normalizedStatus = status.toLowerCase()
      if (allowedStatuses.includes(normalizedStatus)) {
        whereConditions.push(eq(books.status, normalizedStatus as any))
      }
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

    // Determine sort column - map virtual columns to actual database columns
    let sortColumn
    switch (sortBy) {
      case 'averageRating':
        // For averageRating, we'll sort by createdAt and then sort in memory after getting ratings
        sortColumn = books.createdAt
        break
      case 'title':
        sortColumn = books.title
        break
      case 'author':
        sortColumn = books.author
        break
      case 'price':
        sortColumn = books.price
        break
      case 'category':
        sortColumn = books.category
        break
      case 'status':
        sortColumn = books.status
        break
      case 'updatedAt':
        sortColumn = books.updatedAt
        break
      case 'createdAt':
      default:
        sortColumn = books.createdAt
        break
    }

    // Get books with pagination
    const [allBooks, totalCountResult] = await Promise.all([
      trackDbQuery(
        'books.findMany',
        () => db.select()
        .from(books)
        .where(whereClause)
        .orderBy(sortOrder === 'desc' ? desc(sortColumn) : asc(sortColumn))
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
          tags: book.tags || [],
          hasDownload: !!(book.bookFile || book.digitalDownload),
          canDownload: book.isFree || false, // Free books can be downloaded immediately
          downloadUrl: book.isFree ? `/api/books/${book.id}/download` : null
        }
      })
    )

    // Sort by averageRating if requested (since we can't do this in SQL)
    let finalBooks = booksWithMetadata
    if (sortBy === 'averageRating') {
      finalBooks = booksWithMetadata.sort((a, b) => {
        const comparison = b.averageRating - a.averageRating
        return sortOrder === 'desc' ? comparison : -comparison
      })
    }

    const result = {
      books: finalBooks,
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
  author: z.string().min(1, "Author is required").max(100, "Author name too long"),
  description: z.string().min(10, "Description must be at least 10 characters").max(2000, "Description too long"),
  isFree: z.boolean().default(false),
  price: z.number().min(0, "Price must be positive").max(1000000, "Price too high").optional(),
  priceUsd: z.number().min(0, "USD price must be positive").max(1000000, "USD price too high").optional(),
  priceNgn: z.number().min(0, "NGN price must be positive").max(1000000, "NGN price too high").optional(),
  coverImage: z.string().url().optional(),
  frontCoverImage: z.string().url().optional(),
  backCoverImage: z.string().url().optional(),
  bookFile: z.string().url().optional(), // PDF/EPUB file URL
  digitalDownload: z.string().url().optional(), // Alternative download link
  category: z.string().min(1, "Category is required"),
  status: z.enum(["draft", "published", "pending_review", "approved", "rejected", "archived"]).default("draft"),
  tags: z.array(z.string()).optional(),
  isbn: z.string().optional(),
  publisher: z.string().optional(),
  publishedYear: z.number().optional(),
  pageCount: z.number().optional(),
  language: z.string().default("English"),
  slug: z.string().optional() // Allow manual slug override
}).refine(
  (data) => {
    // If the book is not free, at least one price must be provided
    if (!data.isFree) {
      return data.price || data.priceUsd || data.priceNgn;
    }
    return true; // Free books don't need prices
  },
  {
    message: "Paid books must have at least one price (price, priceUsd, or priceNgn)",
    path: ["price"]
  }
)

// POST create new book (admin only)
async function createBookHandler(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session || session.user.role !== "admin") {
      return NextResponse.json(
        { success: false, error: "Unauthorized. Admin access required." },
        { status: 401 }
      )
    }

    const body = await request.json()
    const bookData = bookSchema.parse(body)

    // Generate slug from title if not provided
    let slug = bookData.slug || generateSlug(bookData.title)
    
    // Ensure slug is unique
    let slugCounter = 0
    const originalSlug = slug
    while (true) {
      const existingSlugBook = await trackDbQuery(
        'books.findFirst.slug',
        () => db.select().from(books).where(eq(books.slug, slug)).limit(1)
      )
      
      if (existingSlugBook.length === 0) break
      
      slugCounter++
      slug = `${originalSlug}-${slugCounter}`
    }

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
      () => {
        const insertData: any = {
          title: bookData.title,
          author: bookData.author,
          description: bookData.description,
          isFree: bookData.isFree,
          price: bookData.isFree ? '0' : (bookData.price?.toString() || '0'),
          category: bookData.category,
          status: bookData.status,
          language: bookData.language,
          slug: slug,
          createdAt: new Date(),
          updatedAt: new Date()
        }

        // Add optional fields only if they exist
        if (!bookData.isFree && bookData.priceUsd) insertData.priceUsd = bookData.priceUsd.toString()
        if (!bookData.isFree && bookData.priceNgn) insertData.priceNgn = bookData.priceNgn.toString()
        if (bookData.coverImage) insertData.coverImage = bookData.coverImage
        if (bookData.frontCoverImage) insertData.frontCoverImage = bookData.frontCoverImage
        if (bookData.backCoverImage) insertData.backCoverImage = bookData.backCoverImage
        if (bookData.bookFile) insertData.bookFile = bookData.bookFile
        if (bookData.digitalDownload) insertData.digitalDownload = bookData.digitalDownload
        if (bookData.tags) insertData.tags = bookData.tags
        if (bookData.isbn) insertData.isbn = bookData.isbn
        if (bookData.publisher) insertData.publisher = bookData.publisher
        if (bookData.publishedYear) insertData.publishedYear = bookData.publishedYear
        if (bookData.pageCount) insertData.pageCount = bookData.pageCount

        return db.insert(books).values(insertData).returning()
      }
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
    .replace(/[^a-z0-9 -]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
    .replace(/^-+|-+$/g, '') // Remove leading/trailing hyphens
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
