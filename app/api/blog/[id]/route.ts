import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { blogPosts } from "@/lib/db/schema"
import { eq } from "drizzle-orm"

const updateBlogPostSchema = z.object({
  title: z.string().min(1, "Title is required").optional(),
  content: z.string().min(1, "Content is required").optional(),
  excerpt: z.string().min(1, "Excerpt is required").optional(),
  coverImage: z.string().url().optional(),
  category: z.string().min(1, "Category is required").optional(),
  tags: z.array(z.string()).optional(),
  status: z.enum(["draft", "published", "scheduled"]).optional(),
  publishedAt: z.string().datetime().optional(),
  seoTitle: z.string().optional(),
  seoDescription: z.string().optional(),
})

// GET /api/blog/[id] - Get single blog post
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const post = await db
      .select()
      .from(blogPosts)
      .where(eq(blogPosts.id, params.id))
      .limit(1)

    if (!post[0]) {
      return NextResponse.json(
        { success: false, error: "Blog post not found" },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: post[0]
    })
  } catch (error) {
    console.error("Error fetching blog post:", error)
    return NextResponse.json(
      { success: false, error: "Failed to fetch blog post" },
      { status: 500 }
    )
  }
}

// PUT /api/blog/[id] - Update blog post (admin only)
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()
    
    if (!session || session.user.role !== "admin") {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      )
    }

    // Check if post exists
    const existingPost = await db
      .select()
      .from(blogPosts)
      .where(eq(blogPosts.id, params.id))
      .limit(1)

    if (!existingPost[0]) {
      return NextResponse.json(
        { success: false, error: "Blog post not found" },
        { status: 404 }
      )
    }

    const body = await request.json()
    const updateData = updateBlogPostSchema.parse(body)

    // Generate new slug if title is being updated
    const updateFields: any = { ...updateData }
    if (updateData.title) {
      updateFields.slug = generateSlug(updateData.title)
    }

    // Handle publishing status changes
    if (updateData.status === "published" && existingPost[0].status !== "published") {
      updateFields.publishedAt = new Date()
    } else if (updateData.status === "draft") {
      updateFields.publishedAt = null
    }

    const updatedPost = await db
      .update(blogPosts)
      .set(updateFields)
      .where(eq(blogPosts.id, params.id))
      .returning()

    return NextResponse.json({
      success: true,
      data: updatedPost[0],
      message: "Blog post updated successfully"
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: "Invalid input", details: error.errors },
        { status: 400 }
      )
    }

    console.error("Error updating blog post:", error)
    return NextResponse.json(
      { success: false, error: "Failed to update blog post" },
      { status: 500 }
    )
  }
}

// DELETE /api/blog/[id] - Delete blog post (admin only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()
    
    if (!session || session.user.role !== "admin") {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      )
    }

    // Check if post exists
    const existingPost = await db
      .select()
      .from(blogPosts)
      .where(eq(blogPosts.id, params.id))
      .limit(1)

    if (!existingPost[0]) {
      return NextResponse.json(
        { success: false, error: "Blog post not found" },
        { status: 404 }
      )
    }

    await db.delete(blogPosts).where(eq(blogPosts.id, params.id))

    return NextResponse.json({
      success: true,
      message: "Blog post deleted successfully"
    })
  } catch (error) {
    console.error("Error deleting blog post:", error)
    return NextResponse.json(
      { success: false, error: "Failed to delete blog post" },
      { status: 500 }
    )
  }
}

// Helper function to generate slug from title
function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9 -]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim()
}
