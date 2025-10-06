import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { newsletterSubscribers } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

// DELETE /api/admin/newsletter/subscribers/[id] - Remove subscriber
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const [subscriber] = await db.select()
      .from(newsletterSubscribers)
      .where(eq(newsletterSubscribers.id, params.id))
      .limit(1)

    if (!subscriber) {
      return NextResponse.json({ error: 'Subscriber not found' }, { status: 404 })
    }

    await db.delete(newsletterSubscribers)
      .where(eq(newsletterSubscribers.id, params.id))

    return NextResponse.json({ message: 'Subscriber removed successfully' })
  } catch (error) {
    console.error('Error removing newsletter subscriber:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT /api/admin/newsletter/subscribers/[id] - Update subscriber status
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { isActive } = body

    if (typeof isActive !== 'boolean') {
      return NextResponse.json({ error: 'isActive must be a boolean' }, { status: 400 })
    }

    const [subscriber] = await db.select()
      .from(newsletterSubscribers)
      .where(eq(newsletterSubscribers.id, params.id))
      .limit(1)

    if (!subscriber) {
      return NextResponse.json({ error: 'Subscriber not found' }, { status: 404 })
    }

    const [updatedSubscriber] = await db.update(newsletterSubscribers)
      .set({ isActive })
      .where(eq(newsletterSubscribers.id, params.id))
      .returning()

    return NextResponse.json(updatedSubscriber)
  } catch (error) {
    console.error('Error updating newsletter subscriber:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
