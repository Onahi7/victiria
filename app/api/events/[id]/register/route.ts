import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { events, eventRegistrations, users, paymentTransactions } from '@/lib/db/schema'
import { eq, and, sql } from 'drizzle-orm'

interface RouteParams {
  params: { id: string }
}

const registrationSchema = z.object({
  specialRequests: z.string().optional(),
  paymentMethod: z.enum(['paystack', 'flutterwave']).default('paystack'),
})

// POST /api/events/[id]/register - Register for event
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth()
    
    if (!session) {
      return NextResponse.json(
        { success: false, error: "Authentication required" },
        { status: 401 }
      )
    }

    const eventId = params.id
    const body = await request.json()
    const { specialRequests, paymentMethod } = registrationSchema.parse(body)

    // Check if event exists and is published
    const event = await db
      .select()
      .from(events)
      .where(and(
        eq(events.id, eventId),
        eq(events.isPublished, true),
        eq(events.status, 'published')
      ))
      .limit(1)

    if (!event.length) {
      return NextResponse.json(
        { success: false, error: 'Event not found or not available for registration' },
        { status: 404 }
      )
    }

    const eventData = event[0]

    // Check if registration deadline has passed
    if (eventData.registrationDeadline && new Date() > eventData.registrationDeadline) {
      return NextResponse.json(
        { success: false, error: 'Registration deadline has passed' },
        { status: 400 }
      )
    }

    // Check if event has already started
    if (new Date() > eventData.startDate) {
      return NextResponse.json(
        { success: false, error: 'Event has already started' },
        { status: 400 }
      )
    }

    // Check if user is already registered
    const existingRegistration = await db
      .select()
      .from(eventRegistrations)
      .where(and(
        eq(eventRegistrations.eventId, eventId),
        eq(eventRegistrations.userId, session.user.id)
      ))
      .limit(1)

    if (existingRegistration.length > 0) {
      return NextResponse.json(
        { success: false, error: 'You are already registered for this event' },
        { status: 400 }
      )
    }

    // Check max attendees limit
    if (eventData.maxAttendees) {
      const currentRegistrations = await db
        .select({ count: sql`COUNT(*)`.as('count') })
        .from(eventRegistrations)
        .where(eq(eventRegistrations.eventId, eventId))

      if (currentRegistrations[0]?.count >= eventData.maxAttendees) {
        return NextResponse.json(
          { success: false, error: 'Event is fully booked' },
          { status: 400 }
        )
      }
    }

    // Determine payment status and amount
    const isFreeEvent = eventData.isFree || parseFloat(eventData.price) === 0
    const amountToPay = isFreeEvent ? 0 : parseFloat(eventData.price)
    
    let paymentReference = null
    let paymentStatus: 'pending' | 'completed' = isFreeEvent ? 'completed' : 'pending'

    // If paid event, initialize payment
    if (!isFreeEvent) {
      paymentReference = `EVT-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`
      
      // Here you would initialize payment with Paystack/Flutterwave
      // For now, we'll just create the registration with pending payment
    }

    // Create registration
    const registration = await db.insert(eventRegistrations).values({
      eventId,
      userId: session.user.id,
      status: 'registered',
      paymentStatus,
      paymentReference,
      amountPaid: isFreeEvent ? 0 : null,
      specialRequests,
      registeredAt: new Date(),
      updatedAt: new Date(),
    }).returning()

    // If paid event, create payment transaction record
    if (!isFreeEvent && paymentReference) {
      await db.insert(paymentTransactions).values({
        orderId: registration[0].id, // Using registration ID
        reference: paymentReference,
        provider: paymentMethod,
        status: 'pending',
        amount: amountToPay,
        currency: 'NGN',
        customerEmail: session.user.email,
        metadata: {
          eventId,
          eventTitle: eventData.title,
          userId: session.user.id,
          type: 'event_registration'
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      })
    }

    return NextResponse.json({
      success: true,
      data: {
        registration: registration[0],
        paymentRequired: !isFreeEvent,
        paymentReference,
        amount: amountToPay,
      },
      message: isFreeEvent 
        ? "Registration successful!" 
        : "Registration created. Please complete payment to confirm your spot."
    })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: "Invalid input", details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error registering for event:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to register for event' },
      { status: 500 }
    )
  }
}

// GET /api/events/[id]/register - Get user's registration status
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth()
    
    if (!session) {
      return NextResponse.json(
        { success: false, error: "Authentication required" },
        { status: 401 }
      )
    }

    const eventId = params.id

    const registration = await db
      .select()
      .from(eventRegistrations)
      .where(and(
        eq(eventRegistrations.eventId, eventId),
        eq(eventRegistrations.userId, session.user.id)
      ))
      .limit(1)

    return NextResponse.json({
      success: true,
      data: {
        isRegistered: registration.length > 0,
        registration: registration[0] || null,
      }
    })

  } catch (error) {
    console.error('Error checking registration status:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to check registration status' },
      { status: 500 }
    )
  }
}

// DELETE /api/events/[id]/register - Cancel registration
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth()
    
    if (!session) {
      return NextResponse.json(
        { success: false, error: "Authentication required" },
        { status: 401 }
      )
    }

    const eventId = params.id

    // Check if user is registered
    const registration = await db
      .select()
      .from(eventRegistrations)
      .where(and(
        eq(eventRegistrations.eventId, eventId),
        eq(eventRegistrations.userId, session.user.id)
      ))
      .limit(1)

    if (!registration.length) {
      return NextResponse.json(
        { success: false, error: 'Registration not found' },
        { status: 404 }
      )
    }

    // Check if event is still in the future (allow cancellation up to 24 hours before)
    const event = await db
      .select()
      .from(events)
      .where(eq(events.id, eventId))
      .limit(1)

    if (event.length > 0) {
      const eventStart = new Date(event[0].startDate)
      const cancellationDeadline = new Date(eventStart.getTime() - 24 * 60 * 60 * 1000) // 24 hours before

      if (new Date() > cancellationDeadline) {
        return NextResponse.json(
          { success: false, error: 'Cannot cancel registration less than 24 hours before event' },
          { status: 400 }
        )
      }
    }

    // Update registration status to cancelled
    await db
      .update(eventRegistrations)
      .set({
        status: 'cancelled',
        updatedAt: new Date(),
      })
      .where(and(
        eq(eventRegistrations.eventId, eventId),
        eq(eventRegistrations.userId, session.user.id)
      ))

    return NextResponse.json({
      success: true,
      message: "Registration cancelled successfully"
    })

  } catch (error) {
    console.error('Error cancelling registration:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to cancel registration' },
      { status: 500 }
    )
  }
}
