import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { blogPosts, users } from "@/lib/db/schema"
import { eq, desc, like, and, or } from "drizzle-orm"

const blogPostSchema = z.object({
  title: z.string().min(1, "Title is required"),
  content: z.string().min(1, "Content is required"),
  excerpt: z.string().min(1, "Excerpt is required"),
  coverImage: z.string().url().optional(),
  category: z.string().min(1, "Category is required"),
  tags: z.array(z.string()).optional().default([]),
  status: z.enum(["draft", "published", "archived"]).default("draft"),
  publishedAt: z.string().datetime().optional(),
  seoTitle: z.string().optional(),
  seoDescription: z.string().optional(),
})

// GET /api/blog - Get all blog posts (with filtering)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status")
    const category = searchParams.get("category")
    const search = searchParams.get("search")
    const limit = parseInt(searchParams.get("limit") || "10")
    const offset = parseInt(searchParams.get("offset") || "0")

    let query = db.select({
      id: blogPosts.id,
      title: blogPosts.title,
      excerpt: blogPosts.excerpt,
      slug: blogPosts.slug,
      coverImage: blogPosts.coverImage,
      category: blogPosts.category,
      tags: blogPosts.tags,
      status: blogPosts.status,
      publishedAt: blogPosts.publishedAt,
      createdAt: blogPosts.createdAt,
      updatedAt: blogPosts.updatedAt,
      author: {
        id: users.id,
        name: users.name,
        avatar: users.avatar,
      },
    })
    .from(blogPosts)
    .leftJoin(users, eq(blogPosts.authorId, users.id))

    // Build where conditions
    const conditions = []
    
    if (status) {
      conditions.push(eq(blogPosts.status, status as any))
    }
    
    if (category) {
      conditions.push(eq(blogPosts.category, category))
    }
    
    if (search) {
      conditions.push(
        or(
          like(blogPosts.title, `%${search}%`),
          like(blogPosts.excerpt, `%${search}%`),
          like(blogPosts.content, `%${search}%`)
        )
      )
    }

    const posts = conditions.length > 0 
      ? await query
          .where(and(...conditions))
          .orderBy(desc(blogPosts.publishedAt))
          .limit(limit)
          .offset(offset)
      : await query
          .orderBy(desc(blogPosts.publishedAt))
          .limit(limit)
          .offset(offset)

    // Transform the data to match expected format
    const transformedPosts = posts.map(post => ({
      ...post,
      tags: Array.isArray(post.tags) ? post.tags : [],
      readTime: post.excerpt ? Math.ceil(post.excerpt.split(' ').length / 200) : 1,
    }))

    return NextResponse.json({
      success: true,
      data: transformedPosts,
    })
  } catch (error) {
    console.error("Error fetching blog posts:", error)
    return NextResponse.json(
      { success: false, error: "Failed to fetch blog posts" },
      { status: 500 }
    )
  }
}

// POST /api/blog - Create new blog post (admin only)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== "admin") {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      )
    }

    const body = await request.json()
    const postData = blogPostSchema.parse(body)

    const newPost = await db.insert(blogPosts)
      .values({
        ...postData,
        authorId: session.user.id,
        publishedAt: postData.status === "published" ? new Date() : null,
        slug: generateSlug(postData.title),
      })
      .returning()

    return NextResponse.json({
      success: true,
      data: newPost[0],
      message: "Blog post created successfully"
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: "Invalid input", details: error.errors },
        { status: 400 }
      )
    }

    console.error("Error creating blog post:", error)
    return NextResponse.json(
      { success: false, error: "Failed to create blog post" },
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
