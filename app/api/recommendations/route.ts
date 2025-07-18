import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { books, orders, users, userPreferences } from "@/lib/db/schema"
import { eq, desc, and, sql, inArray } from "drizzle-orm"

// GET /api/recommendations - Get personalized book recommendations
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
    const limit = parseInt(searchParams.get("limit") || "10")
    const type = searchParams.get("type") || "personalized" // personalized, popular, new, similar

    let recommendations = []

    switch (type) {
      case "personalized":
        recommendations = await getPersonalizedRecommendations(session.user.id, limit)
        break
      
      case "popular":
        recommendations = await getPopularBooks(limit)
        break
      
      case "new":
        recommendations = await getNewReleases(limit)
        break
      
      case "similar":
        const bookId = searchParams.get("bookId")
        if (bookId) {
          recommendations = await getSimilarBooks(bookId, limit)
        } else {
          return NextResponse.json(
            { success: false, error: "bookId is required for similar recommendations" },
            { status: 400 }
          )
        }
        break
      
      default:
        recommendations = await getPopularBooks(limit)
    }

    return NextResponse.json({
      success: true,
      data: {
        recommendations,
        type,
        count: recommendations.length
      }
    })
  } catch (error) {
    console.error("Error fetching recommendations:", error)
    return NextResponse.json(
      { success: false, error: "Failed to fetch recommendations" },
      { status: 500 }
    )
  }
}

// Get personalized recommendations based on user preferences and purchase history
async function getPersonalizedRecommendations(userId: string, limit: number) {
  try {
    // Get user preferences
    const preferences = await db
      .select()
      .from(userPreferences)
      .where(eq(userPreferences.userId, userId))
      .limit(1)

    // Get user's previous purchases
    const purchaseHistory = await db
      .select({
        bookId: orders.bookId,
        book: books
      })
      .from(orders)
      .innerJoin(books, eq(orders.bookId, books.id))
      .where(and(
        eq(orders.userId, userId),
        eq(orders.status, "delivered")
      ))

    const purchasedBookIds = purchaseHistory.map(p => p.bookId)
    const favoriteGenres = preferences[0]?.readingPreferences?.favoriteGenres || []

    // Build recommendation query
    let query = db
      .select({
        id: books.id,
        title: books.title,
        author: books.author,
        description: books.description,
        price: books.price,
        coverImage: books.coverImage,
        category: books.category,
        tags: books.tags,
        createdAt: books.createdAt,
        salesCount: sql<number>`COALESCE(COUNT(${orders.id}), 0)`,
        rating: sql<number>`4.2 + (RANDOM() * 0.8)` // Mock rating for now
      })
      .from(books)
      .leftJoin(orders, and(
        eq(books.id, orders.bookId),
        eq(orders.status, "delivered")
      ))
      .where(and(
        eq(books.isAvailable, true),
        eq(books.status, "published")
      ))
      .groupBy(books.id)

    // Exclude already purchased books
    if (purchasedBookIds.length > 0) {
      query = query.where(and(
        eq(books.isAvailable, true),
        eq(books.status, "published"),
        sql`${books.id} NOT IN (${purchasedBookIds.join(',')})`
      ))
    }

    const allBooks = await query.limit(limit * 2) // Get more to filter by preferences

    // Score books based on user preferences
    const scoredBooks = allBooks.map(book => {
      let score = 0
      
      // Boost score for preferred genres
      if (favoriteGenres.includes(book.category)) {
        score += 50
      }
      
      // Boost score for tags matching preferences
      if (book.tags && Array.isArray(book.tags)) {
        const matchingTags = book.tags.filter(tag => 
          favoriteGenres.includes(tag)
        )
        score += matchingTags.length * 10
      }
      
      // Boost score for popularity
      score += Number(book.salesCount) * 5
      
      // Boost score for newer books
      const daysSincePublished = Math.floor(
        (Date.now() - new Date(book.createdAt).getTime()) / (1000 * 60 * 60 * 24)
      )
      if (daysSincePublished < 30) {
        score += 20
      }
      
      // Add some randomness
      score += Math.random() * 10
      
      return { ...book, score }
    })

    return scoredBooks
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map(({ score, ...book }) => book)
  } catch (error) {
    console.error("Error getting personalized recommendations:", error)
    return getPopularBooks(limit) // Fallback to popular books
  }
}

// Get popular books based on sales
async function getPopularBooks(limit: number) {
  const popularBooks = await db
    .select({
      id: books.id,
      title: books.title,
      author: books.author,
      description: books.description,
      price: books.price,
      coverImage: books.coverImage,
      category: books.category,
      tags: books.tags,
      salesCount: sql<number>`COALESCE(COUNT(${orders.id}), 0)`,
      rating: sql<number>`4.0 + (RANDOM() * 1.0)` // Mock rating
    })
    .from(books)
    .leftJoin(orders, and(
      eq(books.id, orders.bookId),
      eq(orders.status, "delivered")
    ))
    .where(and(
      eq(books.isAvailable, true),
      eq(books.status, "published")
    ))
    .groupBy(books.id)
    .orderBy(desc(sql`COALESCE(COUNT(${orders.id}), 0)`))
    .limit(limit)

  return popularBooks
}

// Get newly released books
async function getNewReleases(limit: number) {
  const newBooks = await db
    .select({
      id: books.id,
      title: books.title,
      author: books.author,
      description: books.description,
      price: books.price,
      coverImage: books.coverImage,
      category: books.category,
      tags: books.tags,
      publishedAt: books.publishedAt,
      rating: sql<number>`4.0 + (RANDOM() * 1.0)` // Mock rating
    })
    .from(books)
    .where(and(
      eq(books.isAvailable, true),
      eq(books.status, "published")
    ))
    .orderBy(desc(books.publishedAt))
    .limit(limit)

  return newBooks
}

// Get books similar to a specific book
async function getSimilarBooks(bookId: string, limit: number) {
  // Get the reference book
  const referenceBook = await db
    .select()
    .from(books)
    .where(eq(books.id, bookId))
    .limit(1)

  if (!referenceBook[0]) {
    return []
  }

  const book = referenceBook[0]
  
  // Find similar books based on category and tags
  const similarBooks = await db
    .select({
      id: books.id,
      title: books.title,
      author: books.author,
      description: books.description,
      price: books.price,
      coverImage: books.coverImage,
      category: books.category,
      tags: books.tags,
      rating: sql<number>`4.0 + (RANDOM() * 1.0)` // Mock rating
    })
    .from(books)
    .where(and(
      eq(books.isAvailable, true),
      eq(books.status, "published"),
      sql`${books.id} != ${bookId}`, // Exclude the reference book
      eq(books.category, book.category) // Same category
    ))
    .limit(limit)

  return similarBooks
}
