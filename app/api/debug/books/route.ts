import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { books } from "@/lib/db/schema"

// GET /api/debug/books - List all books with slugs (for debugging)
export async function GET() {
  try {
    const allBooks = await db.select({
      id: books.id,
      title: books.title,
      slug: books.slug,
      status: books.status,
      author: books.author
    }).from(books)

    return NextResponse.json({
      success: true,
      count: allBooks.length,
      books: allBooks
    })
  } catch (error) {
    console.error("Error fetching books:", error)
    return NextResponse.json(
      { success: false, error: "Failed to fetch books" },
      { status: 500 }
    )
  }
}
