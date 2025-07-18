import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { events, eventRegistrations, users } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'

interface RouteParams {
  params: { id: string }
}

// GET /api/events/[id] - Get single event
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const eventId = params.id

    const eventData = await db
      .select({
        id: events.id,
        title: events.title,
        description: events.description,
        shortDescription: events.shortDescription,
        type: events.type,
        status: events.status,
        startDate: events.startDate,
        endDate: events.endDate,
        timezone: events.timezone,
        location: events.location,
        isOnline: events.isOnline,
        meetingUrl: events.meetingUrl,
        maxAttendees: events.maxAttendees,
        price: events.price,
        isFree: events.isFree,
        featuredImage: events.featuredImage,
        agenda: events.agenda,
        requirements: events.requirements,
        whatYouWillLearn: events.whatYouWillLearn,
        targetAudience: events.targetAudience,
        organizerId: events.organizerId,
        isPublished: events.isPublished,
        registrationDeadline: events.registrationDeadline,
        createdAt: events.createdAt,
        updatedAt: events.updatedAt,
        organizer: {
          id: users.id,
          name: users.name,
          avatar: users.avatar,
          bio: users.bio,
        },
      })
      .from(events)
      .leftJoin(users, eq(events.organizerId, users.id))
      .where(eq(events.id, eventId))
      .limit(1)

    if (!eventData.length) {
      return NextResponse.json(
        { success: false, error: 'Event not found' },
        { status: 404 }
      )
    }

    // Get registration count
    const registrationCount = await db
      .select({ count: sql`COUNT(*)`.as('count') })
      .from(eventRegistrations)
      .where(eq(eventRegistrations.eventId, eventId))

    const event = {
      ...eventData[0],
      registrationCount: registrationCount[0]?.count || 0,
    }

    return NextResponse.json({
      success: true,
      data: event,
    })
  } catch (error) {
    console.error('Error fetching event:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch event' },
      { status: 500 }
    )
  }
}

const updateEventSchema = z.object({
  title: z.string().min(1, "Title is required").max(255, "Title too long").optional(),
  description: z.string().min(1, "Description is required").optional(),
  shortDescription: z.string().max(500, "Short description too long").optional(),
  type: z.enum(['workshop', 'webinar', 'book_launch', 'masterclass', 'meet_greet', 'conference']).optional(),
  status: z.enum(['draft', 'published', 'cancelled', 'completed']).optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  timezone: z.string().optional(),
  location: z.string().optional(),
  isOnline: z.boolean().optional(),
  meetingUrl: z.string().url().optional(),
  maxAttendees: z.number().positive().optional(),
  price: z.number().min(0).optional(),
  isFree: z.boolean().optional(),
  featuredImage: z.string().url().optional(),
  agenda: z.array(z.object({
    time: z.string(),
    title: z.string(),
    description: z.string().optional(),
  })).optional(),
  requirements: z.string().optional(),
  whatYouWillLearn: z.string().optional(),
  targetAudience: z.string().optional(),
  isPublished: z.boolean().optional(),
  registrationDeadline: z.string().datetime().optional(),
})

// PUT /api/events/[id] - Update event (Admin only)
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth()
    
    if (!session) {
      return NextResponse.json(
        { success: false, error: "Authentication required" },
        { status: 401 }
      )
    }

    if (session.user.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: "Admin access required" },
        { status: 403 }
      )
    }

    const eventId = params.id
    const body = await request.json()
    const updateData = updateEventSchema.parse(body)

    // Check if event exists
    const existingEvent = await db
      .select()
      .from(events)
      .where(eq(events.id, eventId))
      .limit(1)

    if (!existingEvent.length) {
      return NextResponse.json(
        { success: false, error: 'Event not found' },
        { status: 404 }
      )
    }

    // Prepare update data
    const updateFields: any = {
      ...updateData,
      updatedAt: new Date(),
    }

    if (updateData.startDate) {
      updateFields.startDate = new Date(updateData.startDate)
    }
    if (updateData.endDate) {
      updateFields.endDate = new Date(updateData.endDate)
    }
    if (updateData.registrationDeadline) {
      updateFields.registrationDeadline = new Date(updateData.registrationDeadline)
    }
    if (updateData.agenda) {
      updateFields.agenda = JSON.stringify(updateData.agenda)
    }

    // Update event
    const updatedEvent = await db
      .update(events)
      .set(updateFields)
      .where(eq(events.id, eventId))
      .returning()

    return NextResponse.json({
      success: true,
      data: updatedEvent[0],
      message: "Event updated successfully"
    })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: "Invalid input", details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error updating event:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update event' },
      { status: 500 }
    )
  }
}

// DELETE /api/events/[id] - Delete event (Admin only)
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth()
    
    if (!session) {
      return NextResponse.json(
        { success: false, error: "Authentication required" },
        { status: 401 }
      )
    }

    if (session.user.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: "Admin access required" },
        { status: 403 }
      )
    }

    const eventId = params.id

    // Check if event exists
    const existingEvent = await db
      .select()
      .from(events)
      .where(eq(events.id, eventId))
      .limit(1)

    if (!existingEvent.length) {
      return NextResponse.json(
        { success: false, error: 'Event not found' },
        { status: 404 }
      )
    }

    // Check if there are any registrations
    const registrations = await db
      .select()
      .from(eventRegistrations)
      .where(eq(eventRegistrations.eventId, eventId))
      .limit(1)

    if (registrations.length > 0) {
      return NextResponse.json(
        { success: false, error: 'Cannot delete event with existing registrations. Cancel the event instead.' },
        { status: 400 }
      )
    }

    // Delete event
    await db.delete(events).where(eq(events.id, eventId))

    return NextResponse.json({
      success: true,
      message: "Event deleted successfully"
    })

  } catch (error) {
    console.error('Error deleting event:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to delete event' },
      { status: 500 }
    )
  }
}
