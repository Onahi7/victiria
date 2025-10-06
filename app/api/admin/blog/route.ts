import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { blogPosts, users } from '@/lib/db/schema'
import { eq, desc, and, ilike, or, ne } from 'drizzle-orm'
import { z } from 'zod'

const createPostSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  content: z.string().min(1, 'Content is required'),
  excerpt: z.string().optional(),
  category: z.string().optional(),
  tags: z.array(z.string()).optional(),
  coverImage: z.string().url().optional().or(z.literal('')),
  seoTitle: z.string().optional(),
  seoDescription: z.string().optional(),
  status: z.enum(['draft', 'published', 'archived']).default('draft')
})

// Helper function to generate unique slug
async function generateUniqueSlug(title: string, excludeId?: string): Promise<string> {
  const baseSlug = title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim()

  let slug = baseSlug
  let counter = 1

  while (true) {
    // Check if slug exists
    const existing = await db
      .select({ id: blogPosts.id })
      .from(blogPosts)
      .where(
        excludeId 
          ? and(eq(blogPosts.slug, slug), ne(blogPosts.id, excludeId))
          : eq(blogPosts.slug, slug)
      )
      .limit(1)

    if (existing.length === 0) {
      return slug
    }

    // Generate new slug with counter
    slug = `${baseSlug}-${counter}`
    counter++
  }
}

// GET /api/admin/blog - Get all blog posts for admin
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const category = searchParams.get('category') || ''
    const status = searchParams.get('status') || ''
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const offset = (page - 1) * limit

    // Build where conditions
    const conditions = []
    
    if (search) {
      conditions.push(
        or(
          ilike(blogPosts.title, `%${search}%`),
          ilike(blogPosts.content, `%${search}%`),
          ilike(blogPosts.excerpt, `%${search}%`)
        )
      )
    }
    
    if (category) {
      conditions.push(eq(blogPosts.category, category))
    }
    
    if (status) {
      conditions.push(eq(blogPosts.status, status as any))
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined

    // Get posts with author information
    const posts = await db
      .select({
        id: blogPosts.id,
        title: blogPosts.title,
        content: blogPosts.content,
        excerpt: blogPosts.excerpt,
        slug: blogPosts.slug,
        coverImage: blogPosts.coverImage,
        category: blogPosts.category,
        tags: blogPosts.tags,
        status: blogPosts.status,
        publishedAt: blogPosts.publishedAt,
        createdAt: blogPosts.createdAt,
        updatedAt: blogPosts.updatedAt,
        seoTitle: blogPosts.seoTitle,
        seoDescription: blogPosts.seoDescription,
        author: {
          id: users.id,
          name: users.name,
          email: users.email
        }
      })
      .from(blogPosts)
      .leftJoin(users, eq(blogPosts.authorId, users.id))
      .where(whereClause)
      .orderBy(desc(blogPosts.createdAt))
      .limit(limit)
      .offset(offset)

    // Get total count for pagination
    const totalResult = await db
      .select({ count: blogPosts.id })
      .from(blogPosts)
      .where(whereClause)

    const total = totalResult.length
    const totalPages = Math.ceil(total / limit)

    return NextResponse.json({
      success: true,
      data: {
        posts,
        pagination: {
          page,
          limit,
          total,
          pages: totalPages
        }
      }
    })

  } catch (error) {
    console.error('Error fetching blog posts:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch blog posts' },
      { status: 500 }
    )
  }
}

// POST /api/admin/blog - Create new blog post
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const validatedData = createPostSchema.parse(body)

    // Generate unique slug from title
    const slug = await generateUniqueSlug(validatedData.title)

    const newPost = await db.insert(blogPosts).values({
      title: validatedData.title,
      content: validatedData.content,
      excerpt: validatedData.excerpt || null,
      slug,
      coverImage: validatedData.coverImage || null,
      category: validatedData.category || null,
      tags: validatedData.tags || [],
      seoTitle: validatedData.seoTitle || null,
      seoDescription: validatedData.seoDescription || null,
      status: validatedData.status,
      authorId: session.user.id,
      publishedAt: validatedData.status === 'published' ? new Date() : null
    }).returning()

    return NextResponse.json({
      success: true,
      message: 'Blog post created successfully',
      data: newPost[0]
    })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Validation failed', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error creating blog post:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create blog post' },
      { status: 500 }
    )
  }
}

// PUT /api/admin/blog - Update blog post
export async function PUT(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { id, ...updateData } = body
    
    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Post ID is required' },
        { status: 400 }
      )
    }

    const validatedData = createPostSchema.parse(updateData)

    // Generate unique slug from title (excluding current post)
    const slug = await generateUniqueSlug(validatedData.title, id)

    const updatedPost = await db
      .update(blogPosts)
      .set({
        title: validatedData.title,
        content: validatedData.content,
        excerpt: validatedData.excerpt || null,
        slug,
        coverImage: validatedData.coverImage || null,
        category: validatedData.category || null,
        tags: validatedData.tags || [],
        seoTitle: validatedData.seoTitle || null,
        seoDescription: validatedData.seoDescription || null,
        status: validatedData.status,
        publishedAt: validatedData.status === 'published' ? new Date() : null,
        updatedAt: new Date()
      })
      .where(eq(blogPosts.id, id))
      .returning()

    if (updatedPost.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Blog post not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Blog post updated successfully',
      data: updatedPost[0]
    })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Validation failed', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error updating blog post:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update blog post' },
      { status: 500 }
    )
  }
}

// DELETE /api/admin/blog - Delete blog post
export async function DELETE(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    
    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Post ID is required' },
        { status: 400 }
      )
    }

    const deletedPost = await db
      .delete(blogPosts)
      .where(eq(blogPosts.id, id))
      .returning()

    if (deletedPost.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Blog post not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Blog post deleted successfully'
    })

  } catch (error) {
    console.error('Error deleting blog post:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to delete blog post' },
      { status: 500 }
    )
  }
}