import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { blogPosts } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

const blogPostSchema = z.object({
  title: z.string().min(1, "Title is required").max(255, "Title too long"),
  content: z.string().min(1, "Content is required"),
  excerpt: z.string().min(1, "Excerpt is required"),
  category: z.string().optional().nullable(),
  tags: z.array(z.string()).optional().default([]),
  coverImage: z.string().url().optional().nullable(),
  seoTitle: z.string().max(255, "SEO title too long").optional().nullable(),
  seoDescription: z.string().optional().nullable(),
  status: z.enum(['draft', 'published', 'archived']).default('draft'),
})

// GET /api/admin/blog/[id] - Get a specific blog post (admin only)
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const post = await db
      .select()
      .from(blogPosts)
      .where(eq(blogPosts.id, params.id))
      .limit(1)

    if (post.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Blog post not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: post[0],
    })
  } catch (error) {
    console.error('Error fetching blog post:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch blog post' },
      { status: 500 }
    )
  }
}

// PUT /api/admin/blog/[id] - Update a blog post (admin only)
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const validatedData = blogPostSchema.parse(body)

    // Check if the post exists
    const existingPost = await db
      .select()
      .from(blogPosts)
      .where(eq(blogPosts.id, params.id))
      .limit(1)

    if (existingPost.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Blog post not found' },
        { status: 404 }
      )
    }

    // Update the post
    const updatedPost = await db
      .update(blogPosts)
      .set({
        title: validatedData.title,
        content: validatedData.content,
        excerpt: validatedData.excerpt,
        coverImage: validatedData.coverImage,
        category: validatedData.category,
        tags: validatedData.tags,
        seoTitle: validatedData.seoTitle,
        seoDescription: validatedData.seoDescription,
        status: validatedData.status,
        publishedAt: validatedData.status === 'published' && !existingPost[0].publishedAt 
          ? new Date() 
          : existingPost[0].publishedAt,
        updatedAt: new Date(),
      })
      .where(eq(blogPosts.id, params.id))
      .returning()

    return NextResponse.json({
      success: true,
      data: updatedPost[0],
    })
  } catch (error) {
    console.error('Error updating blog post:', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Invalid data', details: error.errors },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { success: false, error: 'Failed to update blog post' },
      { status: 500 }
    )
  }
}

// DELETE /api/admin/blog/[id] - Delete a blog post (admin only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Check if the post exists
    const existingPost = await db
      .select()
      .from(blogPosts)
      .where(eq(blogPosts.id, params.id))
      .limit(1)

    if (existingPost.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Blog post not found' },
        { status: 404 }
      )
    }

    // Delete the post
    await db
      .delete(blogPosts)
      .where(eq(blogPosts.id, params.id))

    return NextResponse.json({
      success: true,
      message: 'Blog post deleted successfully',
    })
  } catch (error) {
    console.error('Error deleting blog post:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to delete blog post' },
      { status: 500 }
    )
  }
}
