import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { books } from "@/lib/db/schema"
import { eq } from "drizzle-orm"

// GET /api/books/slug/[slug] - Get book by slug
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    // Await the params Promise
    const { slug } = await params
    
    console.log('Looking for book with slug:', slug) // Debug log
    
    if (!slug || slug === 'undefined') {
      return NextResponse.json(
        { success: false, error: "Invalid slug parameter" },
        { status: 400 }
      )
    }

    const book = await db.select()
      .from(books)
      .where(eq(books.slug, slug))
      .limit(1)

    console.log('Database query result:', book) // Debug log

    if (!book.length) {
      return NextResponse.json(
        { success: false, error: "Book not found", requestedSlug: slug },
        { status: 404 }
      )
    }

    // Only return published books for public access
    if (book[0].status !== "published") {
      return NextResponse.json(
        { success: false, error: "Book not available", status: book[0].status, requestedSlug: slug },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: {
        ...book[0],
        // Convert price fields to numbers for frontend compatibility
        price: parseFloat(book[0].price) || 0,
        priceUsd: book[0].priceUsd ? parseFloat(book[0].priceUsd) : undefined,
        priceNgn: book[0].priceNgn ? parseFloat(book[0].priceNgn) : undefined,
        // Convert other numeric fields
        salesCount: book[0].salesCount || 0,
        pageCount: book[0].pageCount || undefined,
        // Convert boolean fields
        isAvailable: book[0].isAvailable || false,
        isFree: book[0].isFree || false,
      }
    })
  } catch (error) {
    console.error("Error fetching book by slug:", error)
    return NextResponse.json(
      { success: false, error: "Failed to fetch book" },
      { status: 500 }
    )
  }
}
