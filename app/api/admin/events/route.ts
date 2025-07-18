import { NextRequest, NextResponse } from "next/server"
import { getAuthSession } from "@/lib/auth"
import { db } from "@/lib/db"
import { events, eventRegistrations, users } from "@/lib/db/schema"
import { eq, desc, sql, count, and, ilike, or, gte } from "drizzle-orm"

// GET /api/admin/events - Get all events with admin details
export async function GET(request: NextRequest) {
  try {
    const session = await getAuthSession()
    
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "10")
    const search = searchParams.get("search") || ""
    const status = searchParams.get("status") || ""
    const type = searchParams.get("type") || ""
    const upcoming = searchParams.get("upcoming") === "true"

    const offset = (page - 1) * limit

    // Build where conditions
    const whereConditions = []
    
    if (search) {
      whereConditions.push(
        or(
          ilike(events.title, `%${search}%`),
          ilike(events.description, `%${search}%`)
        )
      )
    }
    
    if (status && ['draft', 'published', 'cancelled', 'completed'].includes(status)) {
      whereConditions.push(eq(events.status, status as 'draft' | 'published' | 'cancelled' | 'completed'))
    }
    
    if (type && ['workshop', 'webinar', 'book_launch', 'masterclass', 'meet_greet', 'conference'].includes(type)) {
      whereConditions.push(eq(events.type, type as 'workshop' | 'webinar' | 'book_launch' | 'masterclass' | 'meet_greet' | 'conference'))
    }

    if (upcoming) {
      whereConditions.push(gte(events.startDate, new Date()))
    }

    const whereClause = whereConditions.length > 0 ? and(...whereConditions) : undefined

    // Get events with registration counts
    const eventsQuery = db
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
        organizerId: events.organizerId,
        isPublished: events.isPublished,
        registrationDeadline: events.registrationDeadline,
        createdAt: events.createdAt,
        updatedAt: events.updatedAt,
        organizer: {
          name: users.name,
          email: users.email
        },
        registrationCount: sql<number>`(
          SELECT COUNT(*) FROM ${eventRegistrations} 
          WHERE ${eventRegistrations.eventId} = ${events.id}
        )`,
        attendeeCount: sql<number>`(
          SELECT COUNT(*) FROM ${eventRegistrations} 
          WHERE ${eventRegistrations.eventId} = ${events.id} 
          AND ${eventRegistrations.status} = 'attended'
        )`,
        revenue: sql<number>`(
          SELECT COALESCE(SUM(${eventRegistrations.amountPaid}), 0) 
          FROM ${eventRegistrations} 
          WHERE ${eventRegistrations.eventId} = ${events.id} 
          AND ${eventRegistrations.paymentStatus} = 'completed'
        )`
      })
      .from(events)
      .leftJoin(users, eq(events.organizerId, users.id))

    if (whereClause) {
      eventsQuery.where(whereClause)
    }

    eventsQuery.orderBy(desc(events.createdAt))

    const eventsList = await eventsQuery.limit(limit).offset(offset)

    // Get total count for pagination
    const totalCountQuery = db
      .select({ count: count() })
      .from(events)

    if (whereClause) {
      totalCountQuery.where(whereClause)
    }

    const totalCount = await totalCountQuery
    const total = totalCount[0]?.count || 0

    return NextResponse.json({
      success: true,
      data: {
        events: eventsList,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    })
  } catch (error) {
    console.error("Error fetching admin events:", error)
    return NextResponse.json(
      { success: false, error: "Failed to fetch events" },
      { status: 500 }
    )
  }
}

// POST /api/admin/events - Create a new event
export async function POST(request: NextRequest) {
  try {
    const session = await getAuthSession()
    
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      )
    }

    const body = await request.json()
    const {
      title,
      description,
      shortDescription,
      type,
      startDate,
      endDate,
      timezone,
      location,
      isOnline,
      meetingUrl,
      maxAttendees,
      price,
      isFree,
      featuredImage,
      agenda,
      requirements,
      whatYouWillLearn,
      targetAudience,
      registrationDeadline
    } = body

    const newEvent = await db.insert(events).values({
      title,
      description,
      shortDescription,
      type,
      status: 'draft',
      startDate: new Date(startDate),
      endDate: endDate ? new Date(endDate) : null,
      timezone: timezone || 'Africa/Lagos',
      location,
      isOnline: isOnline || false,
      meetingUrl,
      maxAttendees,
      price: price ? price.toString() : '0.00',
      isFree: isFree || true,
      featuredImage,
      agenda: agenda || [],
      requirements,
      whatYouWillLearn,
      targetAudience,
      organizerId: session.user.id,
      isPublished: false,
      registrationDeadline: registrationDeadline ? new Date(registrationDeadline) : null
    }).returning()

    return NextResponse.json({
      success: true,
      data: newEvent[0],
      message: "Event created successfully"
    })
  } catch (error) {
    console.error("Error creating event:", error)
    return NextResponse.json(
      { success: false, error: "Failed to create event" },
      { status: 500 }
    )
  }
}

// PUT /api/admin/events - Update event
export async function PUT(request: NextRequest) {
  try {
    const session = await getAuthSession()
    
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { id, action, ...updateData } = body

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Event ID is required" },
        { status: 400 }
      )
    }

    let updateFields = { ...updateData }

    // Handle specific actions
    if (action) {
      switch (action) {
        case 'publish':
          updateFields = {
            status: 'published',
            isPublished: true
          }
          break
        case 'unpublish':
          updateFields = {
            status: 'draft',
            isPublished: false
          }
          break
        case 'cancel':
          updateFields = {
            status: 'cancelled'
          }
          break
        case 'complete':
          updateFields = {
            status: 'completed'
          }
          break
      }
    }

    // Convert date fields
    if (updateFields.startDate) {
      updateFields.startDate = new Date(updateFields.startDate)
    }
    if (updateFields.endDate) {
      updateFields.endDate = new Date(updateFields.endDate)
    }
    if (updateFields.registrationDeadline) {
      updateFields.registrationDeadline = new Date(updateFields.registrationDeadline)
    }

    updateFields.updatedAt = new Date()

    const updatedEvent = await db
      .update(events)
      .set(updateFields)
      .where(eq(events.id, id))
      .returning()

    if (updatedEvent.length === 0) {
      return NextResponse.json(
        { success: false, error: "Event not found" },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: updatedEvent[0],
      message: `Event ${action ? action + 'd' : 'updated'} successfully`
    })
  } catch (error) {
    console.error("Error updating event:", error)
    return NextResponse.json(
      { success: false, error: "Failed to update event" },
      { status: 500 }
    )
  }
}

// DELETE /api/admin/events - Delete an event
export async function DELETE(request: NextRequest) {
  try {
    const session = await getAuthSession()
    
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Event ID is required" },
        { status: 400 }
      )
    }

    // Check if event has registrations
    const eventRegistrationsCount = await db
      .select({ count: count() })
      .from(eventRegistrations)
      .where(eq(eventRegistrations.eventId, id))

    if (eventRegistrationsCount[0]?.count > 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: "Cannot delete event with registrations. Consider cancelling instead." 
        },
        { status: 400 }
      )
    }

    const deletedEvent = await db
      .delete(events)
      .where(eq(events.id, id))
      .returning()

    if (deletedEvent.length === 0) {
      return NextResponse.json(
        { success: false, error: "Event not found" },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      message: "Event deleted successfully"
    })
  } catch (error) {
    console.error("Error deleting event:", error)
    return NextResponse.json(
      { success: false, error: "Failed to delete event" },
      { status: 500 }
    )
  }
}
