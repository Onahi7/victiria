import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { books, users } from '@/lib/db/schema'
import { withErrorTracking } from '@/lib/monitoring/error-tracker'
import { withPerformanceTracking, trackDbQuery } from '@/lib/monitoring/performance'
import CacheService, { CACHE_CONFIG } from '@/lib/cache/redis'
import { and, ilike, eq, desc, count } from 'drizzle-orm'

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
          title: books.title,
          id: books.id,
          coverImage: books.coverImage,
          price: books.price
        })
        .from(books)
        .where(
          and(
            ilike(books.title, `%${query}%`),
            eq(books.status, 'published')
          )
        )
        .orderBy(desc(books.createdAt))
        .limit(5)
      ),

      // Categories
      trackDbQuery(
        'suggest.categories',
        () => db.select({
          category: books.category,
          count: count()
        })
        .from(books)
        .where(
          and(
            ilike(books.category, `%${query}%`),
            eq(books.status, 'published')
          )
        )
        .groupBy(books.category)
        .orderBy(desc(count()))
        .limit(3)
      ),

      // Authors
      trackDbQuery(
        'suggest.authors',
        () => db.select({
          name: users.name,
          id: users.id,
          avatar: users.avatar
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
        id: book.id,
        image: book.coverImage,
        price: book.price,
        category: 'Books'
      })),
      categories: categorySuggestions.map(cat => ({
        type: 'category',
        text: cat.category,
        count: cat.count,
        category: 'Categories'
      })),
      authors: authorSuggestions.map(author => ({
        type: 'author',
        text: author.name,
        id: author.id,
        image: author.avatar,
        category: 'Authors'
      })),
      tags: [] // TODO: implement tags when needed
    }

    // Flatten and sort by relevance
    const allSuggestions = [
      ...suggestions.books,
      ...suggestions.categories,
      ...suggestions.authors
    ].sort((a, b) => {
      // Prioritize exact matches
      const aExact = a.text.toLowerCase().startsWith(query.toLowerCase())
      const bExact = b.text.toLowerCase().startsWith(query.toLowerCase())
      
      if (aExact && !bExact) return -1
      if (!aExact && bExact) return 1
      
      // Then by type priority (books > authors > categories)
      const typePriority = { book: 3, author: 2, category: 1 }
      return (typePriority[b.type as keyof typeof typePriority] || 0) - 
             (typePriority[a.type as keyof typeof typePriority] || 0)
    }).slice(0, 10)

    const result = {
      suggestions: allSuggestions,
      query,
      totalCount: allSuggestions.length
    }

    await CacheService.set(cacheKey, result, CACHE_CONFIG.TTL.SHORT)

    return NextResponse.json({
      success: true,
      data: result,
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

export const GET = withErrorTracking(withPerformanceTracking(suggestHandler))
