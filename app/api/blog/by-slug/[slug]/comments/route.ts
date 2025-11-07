import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { blogComments, blogPosts } from '@/lib/db/schema'
import { eq, and, isNull, desc } from 'drizzle-orm'
import { z } from 'zod'

const commentSchema = z.object({
  content: z.string().min(1, "Comment is required").max(1000, "Comment too long"),
  parentId: z.string().uuid().optional().nullable(),
})

// GET /api/blog/[slug]/comments - Get all comments for a blog post
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params

    // Get the blog post
    const post = await db
      .select({ id: blogPosts.id })
      .from(blogPosts)
      .where(eq(blogPosts.slug, slug))
      .limit(1)

    if (!post[0]) {
      return NextResponse.json(
        { success: false, error: 'Blog post not found' },
        { status: 404 }
      )
    }

    // Get all comments for the post
    const comments = await db
      .select()
      .from(blogComments)
      .where(and(
        eq(blogComments.postId, post[0].id),
        isNull(blogComments.parentId)
      ))
      .orderBy(desc(blogComments.createdAt))

    return NextResponse.json({
      success: true,
      comments,
    })
  } catch (error) {
    console.error('Error fetching comments:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch comments' },
      { status: 500 }
    )
  }
}

// POST /api/blog/[slug]/comments - Create a new comment
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { slug } = await params
    const body = await request.json()
    const validatedData = commentSchema.parse(body)

    // Get the blog post
    const post = await db
      .select({ id: blogPosts.id })
      .from(blogPosts)
      .where(eq(blogPosts.slug, slug))
      .limit(1)

    if (!post[0]) {
      return NextResponse.json(
        { success: false, error: 'Blog post not found' },
        { status: 404 }
      )
    }

    // Create the comment
    const newComment = await db
      .insert(blogComments)
      .values({
        postId: post[0].id,
        authorId: session.user.id,
        content: validatedData.content,
        parentId: validatedData.parentId || null,
      })
      .returning()

    return NextResponse.json({
      success: true,
      comment: newComment[0],
    })
  } catch (error) {
    console.error('Error creating comment:', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Invalid data', details: error.errors },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { success: false, error: 'Failed to create comment' },
      { status: 500 }
    )
  }
}
