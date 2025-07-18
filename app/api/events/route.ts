import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { events, eventRegistrations, users } from '@/lib/db/schema'
import { eq, and, gte, desc, sql, count } from 'drizzle-orm'

// GET /api/events - Fetch events
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type')
    const status = searchParams.get('status') || 'published'
    const upcoming = searchParams.get('upcoming') === 'true'
    const limit = parseInt(searchParams.get('limit') || '10')
    const offset = parseInt(searchParams.get('offset') || '0')

    let whereConditions = []

    // Filter by status
    if (status !== 'all') {
      whereConditions.push(eq(events.status, status as any))
    }

    // Filter by type
    if (type && type !== 'all') {
      whereConditions.push(eq(events.type, type as any))
    }

    // Filter upcoming events
    if (upcoming) {
      whereConditions.push(gte(events.startDate, new Date()))
    }

    // Get events with registration count
    const eventsData = await db
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
        maxAttendees: events.maxAttendees,
        price: events.price,
        isFree: events.isFree,
        featuredImage: events.featuredImage,
        organizerId: events.organizerId,
        isPublished: events.isPublished,
        registrationDeadline: events.registrationDeadline,
        createdAt: events.createdAt,
        organizer: {
          id: users.id,
          name: users.name,
          avatar: users.avatar,
        },
        registrationCount: sql<number>`COUNT(${eventRegistrations.id})`.as('registration_count'),
      })
      .from(events)
      .leftJoin(users, eq(events.organizerId, users.id))
      .leftJoin(eventRegistrations, eq(events.id, eventRegistrations.eventId))
      .where(whereConditions.length > 0 ? and(...whereConditions) : undefined)
      .groupBy(events.id, users.id, users.name, users.avatar)
      .orderBy(desc(events.startDate))
      .limit(limit)
      .offset(offset)

    return NextResponse.json({
      success: true,
      data: eventsData,
    })
  } catch (error) {
    console.error('Error fetching events:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch events' },
      { status: 500 }
    )
  }
}

const createEventSchema = z.object({
  title: z.string().min(1, "Title is required").max(255, "Title too long"),
  description: z.string().min(1, "Description is required"),
  shortDescription: z.string().max(500, "Short description too long").optional(),
  type: z.enum(['workshop', 'webinar', 'book_launch', 'masterclass', 'meet_greet', 'conference']),
  startDate: z.string().datetime(),
  endDate: z.string().datetime().optional(),
  timezone: z.string().default('Africa/Lagos'),
  location: z.string().optional(),
  isOnline: z.boolean().default(false),
  meetingUrl: z.string().url().optional(),
  maxAttendees: z.number().positive().optional(),
  price: z.number().min(0).default(0),
  isFree: z.boolean().default(true),
  featuredImage: z.string().url().optional(),
  agenda: z.array(z.object({
    time: z.string(),
    title: z.string(),
    description: z.string().optional(),
  })).optional(),
  requirements: z.string().optional(),
  whatYouWillLearn: z.string().optional(),
  targetAudience: z.string().optional(),
  registrationDeadline: z.string().datetime().optional(),
})

// POST /api/events - Create event (Admin only)
export async function POST(request: NextRequest) {
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

    const body = await request.json()
    const eventData = createEventSchema.parse(body)

    // Create event
    const newEvent = await db.insert(events).values({
      ...eventData,
      organizerId: session.user.id,
      status: 'draft',
      startDate: new Date(eventData.startDate),
      endDate: eventData.endDate ? new Date(eventData.endDate) : null,
      registrationDeadline: eventData.registrationDeadline ? new Date(eventData.registrationDeadline) : null,
      agenda: eventData.agenda ? JSON.stringify(eventData.agenda) : null,
      createdAt: new Date(),
      updatedAt: new Date(),
    }).returning()

    return NextResponse.json({
      success: true,
      data: newEvent[0],
      message: "Event created successfully"
    }, { status: 201 })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: "Invalid input", details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error creating event:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create event' },
      { status: 500 }
    )
  }
}
