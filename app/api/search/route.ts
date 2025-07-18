import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { books, users, reviews, orders } from '@/lib/db/schema'
import { withCache, CacheStrategies } from '@/lib/cache/middleware'
import { withErrorTracking } from '@/lib/monitoring/error-tracker'
import { withPerformanceTracking, trackDbQuery } from '@/lib/monitoring/performance'
import CacheService, { CACHE_CONFIG } from '@/lib/cache/redis'
import { and, or, gte, lte, ilike, eq, count, desc, asc, sql } from 'drizzle-orm'

interface SearchFilters {
  query?: string
  category?: string
  minPrice?: number
  maxPrice?: number
  rating?: number
  author?: string
  tags?: string[]
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
  page?: number
  limit?: number
}

async function searchHandler(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    
    const filters: SearchFilters = {
      query: searchParams.get('q') || searchParams.get('query') || '',
      category: searchParams.get('category') || undefined,
      minPrice: searchParams.get('minPrice') ? parseFloat(searchParams.get('minPrice')!) : undefined,
      maxPrice: searchParams.get('maxPrice') ? parseFloat(searchParams.get('maxPrice')!) : undefined,
      rating: searchParams.get('rating') ? parseFloat(searchParams.get('rating')!) : undefined,
      author: searchParams.get('author') || undefined,
      tags: searchParams.get('tags') ? searchParams.get('tags')!.split(',') : undefined,
      sortBy: searchParams.get('sortBy') || 'relevance',
      sortOrder: (searchParams.get('sortOrder') as 'asc' | 'desc') || 'desc',
      page: parseInt(searchParams.get('page') || '1'),
      limit: Math.min(parseInt(searchParams.get('limit') || '20'), 50)
    }

    // Generate cache key
    const cacheKey = `${CACHE_CONFIG.KEYS.SEARCH}${JSON.stringify(filters)}`
    
    // Check cache first
    const cached = await CacheService.get(cacheKey)
    if (cached) {
      return NextResponse.json({
        success: true,
        data: cached,
        cached: true,
        timestamp: Date.now()
      })
    }

    // Build search query
    const searchResults = await performSearch(filters)

    // Cache results
    await CacheService.set(cacheKey, searchResults, CACHE_CONFIG.TTL.MEDIUM)

    return NextResponse.json({
      success: true,
      data: searchResults,
      cached: false,
      timestamp: Date.now()
    })

  } catch (error) {
    console.error('Search error:', error)
    return NextResponse.json(
      { success: false, error: 'Search failed' },
      { status: 500 }
    )
  }
}

async function performSearch(filters: SearchFilters) {
  const { query, category, minPrice, maxPrice, rating, author, tags, sortBy, sortOrder, page = 1, limit = 20 } = filters
  
  // Build where conditions
  const whereConditions = [eq(books.status, 'published')]

  // Text search
  if (query && query.trim()) {
    whereConditions.push(
      or(
        ilike(books.title, `%${query}%`),
        ilike(books.description, `%${query}%`),
        ilike(books.category, `%${query}%`),
        ilike(books.author, `%${query}%`)
      )
    )
  }

  // Category filter
  if (category && category !== 'all') {
    whereConditions.push(eq(books.category, category))
  }

  // Price range filter
  if (minPrice !== undefined) {
    whereConditions.push(gte(books.price, minPrice.toString()))
  }
  if (maxPrice !== undefined) {
    whereConditions.push(lte(books.price, maxPrice.toString()))
  }

  // Author filter
  if (author) {
    whereConditions.push(ilike(books.author, `%${author}%`))
  }

  const whereClause = and(...whereConditions)
  const skip = (page - 1) * limit

  // Build order clause
  let orderClause
  switch (sortBy) {
    case 'price':
      orderClause = sortOrder === 'desc' ? desc(books.price) : asc(books.price)
      break
    case 'title':
      orderClause = sortOrder === 'desc' ? desc(books.title) : asc(books.title)
      break
    case 'newest':
      orderClause = desc(books.createdAt)
      break
    default:
      orderClause = desc(books.createdAt)
  }

  // Execute search
  const [searchBooks, totalCountResult] = await Promise.all([
    trackDbQuery(
      'search.books',
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
        createdAt: books.createdAt,
        updatedAt: books.updatedAt
      })
      .from(books)
      .where(whereClause)
      .orderBy(orderClause)
      .limit(limit)
      .offset(skip)
    ),

    trackDbQuery(
      'search.count',
      () => db.select({ count: count() }).from(books).where(whereClause)
    )
  ])

  const totalCount = totalCountResult[0]?.count || 0

  // Get categories for filters
  const categoriesResult = await trackDbQuery(
    'search.categories',
    () => db.select({
      category: books.category,
      count: count()
    })
    .from(books)
    .where(eq(books.status, 'published'))
    .groupBy(books.category)
  )

  // Get price range
  const priceRangeResult = await trackDbQuery(
    'search.priceRange',
    () => db.select({
      minPrice: sql<number>`MIN(${books.price})`,
      maxPrice: sql<number>`MAX(${books.price})`
    })
    .from(books)
    .where(eq(books.status, 'published'))
  )

  // Enhance books with metadata
  const enhancedBooks = await Promise.all(
    searchBooks.map(async book => {
      const reviewStats = await trackDbQuery(
        'book.reviewStats',
        () => db.select({
          avgRating: sql<number>`AVG(${reviews.rating})`,
          reviewCount: count()
        })
        .from(reviews)
        .where(eq(reviews.bookId, book.id))
      )

      return {
        ...book,
        averageRating: Number(reviewStats[0]?.avgRating || 0),
        reviewCount: reviewStats[0]?.reviewCount || 0,
        salesCount: 0, // TODO: implement when orders are fixed
        isPopular: false,
        relevanceScore: calculateRelevanceScore(book, query || '')
      }
    })
  )

  return {
    books: enhancedBooks,
    pagination: {
      page,
      limit,
      total: totalCount,
      totalPages: Math.ceil(totalCount / limit),
      hasNextPage: page < Math.ceil(totalCount / limit),
      hasPrevPage: page > 1
    },
    filters: {
      categories: categoriesResult.map(cat => ({
        name: cat.category,
        count: cat.count
      })),
      priceRange: {
        min: Number(priceRangeResult[0]?.minPrice || 0),
        max: Number(priceRangeResult[0]?.maxPrice || 0)
      }
    },
    searchQuery: query,
    appliedFilters: filters
  }
}

function calculateRelevanceScore(book: any, query: string): number {
  if (!query) return 0
  
  let score = 0
  const queryLower = query.toLowerCase()
  
  // Title match (highest weight)
  if (book.title.toLowerCase().includes(queryLower)) {
    score += 10
    if (book.title.toLowerCase().startsWith(queryLower)) {
      score += 5 // Bonus for starting with query
    }
  }
  
  // Category match
  if (book.category.toLowerCase().includes(queryLower)) {
    score += 5
  }
  
  // Description match
  if (book.description.toLowerCase().includes(queryLower)) {
    score += 3
  }
  
  // Tags match
  if (book.tags && book.tags.some((tag: string) => tag.toLowerCase().includes(queryLower))) {
    score += 4
  }
  
  // Author match
  if (book.author.name.toLowerCase().includes(queryLower)) {
    score += 6
  }
  
  // Boost popular books
  if (book.salesCount > 10) score += 2
  if (book.averageRating > 4) score += 1
  
  return score
}

// Auto-suggest endpoint
async function suggestHandler(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q') || ''
    
    if (!query || query.length < 2) {
      return NextResponse.json({
        success: true,
        data: { suggestions: [] }
      })
    }

    const cacheKey = `${CACHE_CONFIG.KEYS.SEARCH}suggest:${query}`
    const cached = await CacheService.get(cacheKey)
    
    if (cached) {
      return NextResponse.json({
        success: true,
        data: cached,
        cached: true
      })
    }

    // Get suggestions from different sources
    const [titleSuggestions, categorySuggestions, authorSuggestions] = await Promise.all([
      // Book titles
      trackDbQuery(
        'suggest.titles',
        () => db.select({
          id: books.id,
          title: books.title
        })
        .from(books)
        .where(
          and(
            ilike(books.title, `%${query}%`),
            eq(books.status, 'published')
          )
        )
        .limit(5)
      ),

      // Categories
      trackDbQuery(
        'suggest.categories',
        () => db.selectDistinct({
          category: books.category
        })
        .from(books)
        .where(
          and(
            ilike(books.category, `%${query}%`),
            eq(books.status, 'published')
          )
        )
        .limit(3)
      ),

      // Authors
      trackDbQuery(
        'suggest.authors',
        () => db.select({
          id: users.id,
          name: users.name
        })
        .from(users)
        .where(
          and(
            ilike(users.name, `%${query}%`),
            eq(users.role, 'admin') // Assuming authors have admin role for now
          )
        )
        .limit(3)
      )
    ])

    const suggestions = {
      books: titleSuggestions.map(book => ({
        type: 'book',
        text: book.title,
        id: book.id
      })),
      categories: categorySuggestions.map(cat => ({
        type: 'category',
        text: cat.category
      })),
      authors: authorSuggestions.map(author => ({
        type: 'author',
        text: author.name,
        id: author.id
      }))
    }

    await CacheService.set(cacheKey, { suggestions }, CACHE_CONFIG.TTL.SHORT)

    return NextResponse.json({
      success: true,
      data: { suggestions },
      cached: false
    })

  } catch (error) {
    console.error('Suggestion error:', error)
    return NextResponse.json(
      { success: false, error: 'Suggestion failed' },
      { status: 500 }
    )
  }
}

// Export with middleware
export const GET = withErrorTracking(
  withPerformanceTracking(
    withCache(searchHandler, CacheStrategies.SEARCH)
  )
)
