import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { wishlists, books } from "@/lib/db/schema"
import { eq, and, desc } from "drizzle-orm"

const addToWishlistSchema = z.object({
  bookId: z.string().min(1, "Book ID is required"),
})

// GET /api/wishlist - Get user's wishlist
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      )
    }

    const wishlistItems = await db
      .select({
        id: wishlists.id,
        addedAt: wishlists.addedAt,
        book: {
          id: books.id,
          title: books.title,
          author: books.author,
          description: books.description,
          price: books.price,
          coverImage: books.coverImage,
          category: books.category,
          isAvailable: books.isAvailable,
        }
      })
      .from(wishlists)
      .innerJoin(books, eq(wishlists.bookId, books.id))
      .where(eq(wishlists.userId, session.user.id))
      .orderBy(desc(wishlists.addedAt))

    return NextResponse.json({
      success: true,
      data: {
        items: wishlistItems,
        count: wishlistItems.length
      }
    })
  } catch (error) {
    console.error("Error fetching wishlist:", error)
    return NextResponse.json(
      { success: false, error: "Failed to fetch wishlist" },
      { status: 500 }
    )
  }
}

// POST /api/wishlist - Add book to wishlist
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { bookId } = addToWishlistSchema.parse(body)

    // Check if book exists
    const book = await db
      .select()
      .from(books)
      .where(eq(books.id, bookId))
      .limit(1)

    if (!book[0]) {
      return NextResponse.json(
        { success: false, error: "Book not found" },
        { status: 404 }
      )
    }

    // Check if book is already in wishlist
    const existingItem = await db
      .select()
      .from(wishlists)
      .where(and(
        eq(wishlists.userId, session.user.id),
        eq(wishlists.bookId, bookId)
      ))
      .limit(1)

    if (existingItem[0]) {
      return NextResponse.json(
        { success: false, error: "Book is already in your wishlist" },
        { status: 400 }
      )
    }

    // Add to wishlist
    const newWishlistItem = await db
      .insert(wishlists)
      .values({
        userId: session.user.id,
        bookId: bookId,
      })
      .returning()

    return NextResponse.json({
      success: true,
      data: newWishlistItem[0],
      message: "Book added to wishlist successfully"
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: "Invalid input", details: error.errors },
        { status: 400 }
      )
    }

    console.error("Error adding to wishlist:", error)
    return NextResponse.json(
      { success: false, error: "Failed to add book to wishlist" },
      { status: 500 }
    )
  }
}

// DELETE /api/wishlist - Remove book from wishlist
export async function DELETE(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const bookId = searchParams.get("bookId")

    if (!bookId) {
      return NextResponse.json(
        { success: false, error: "Book ID is required" },
        { status: 400 }
      )
    }

    // Check if item exists in wishlist
    const existingItem = await db
      .select()
      .from(wishlists)
      .where(and(
        eq(wishlists.userId, session.user.id),
        eq(wishlists.bookId, bookId)
      ))
      .limit(1)

    if (!existingItem[0]) {
      return NextResponse.json(
        { success: false, error: "Book not found in wishlist" },
        { status: 404 }
      )
    }

    // Remove from wishlist
    await db
      .delete(wishlists)
      .where(and(
        eq(wishlists.userId, session.user.id),
        eq(wishlists.bookId, bookId)
      ))

    return NextResponse.json({
      success: true,
      message: "Book removed from wishlist successfully"
    })
  } catch (error) {
    console.error("Error removing from wishlist:", error)
    return NextResponse.json(
      { success: false, error: "Failed to remove book from wishlist" },
      { status: 500 }
    )
  }
}
