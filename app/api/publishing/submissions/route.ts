import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { bookSubmissions, authorProfiles, users } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'

// GET user's submissions
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session) {
      return NextResponse.json(
        { success: false, error: "Authentication required" },
        { status: 401 }
      )
    }

    const submissions = await db
      .select({
        id: bookSubmissions.id,
        title: bookSubmissions.title,
        description: bookSubmissions.description,
        category: bookSubmissions.category,
        price: bookSubmissions.price,
        status: bookSubmissions.status,
        submissionFee: bookSubmissions.submissionFee,
        feePaymentStatus: bookSubmissions.feePaymentStatus,
        submittedAt: bookSubmissions.submittedAt,
        reviewedAt: bookSubmissions.reviewedAt,
        reviewNotes: bookSubmissions.reviewNotes,
        rejectionReason: bookSubmissions.rejectionReason,
        createdAt: bookSubmissions.createdAt,
        updatedAt: bookSubmissions.updatedAt,
      })
      .from(bookSubmissions)
      .where(eq(bookSubmissions.authorId, session.user.id))
      .orderBy(bookSubmissions.createdAt)

    return NextResponse.json({
      success: true,
      data: submissions,
    })
  } catch (error) {
    console.error('Error fetching submissions:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch submissions' },
      { status: 500 }
    )
  }
}

const submissionSchema = z.object({
  title: z.string().min(1, "Title is required").max(255, "Title too long"),
  description: z.string().min(50, "Description must be at least 50 characters").max(2000, "Description too long"),
  category: z.string().min(1, "Category is required"),
  price: z.number().min(100, "Minimum price is ₦100").max(1000000, "Price too high"),
  manuscriptFile: z.string().url("Valid manuscript file URL required"),
  coverImage: z.string().url().optional(),
  synopsis: z.string().min(100, "Synopsis must be at least 100 characters").max(1000, "Synopsis too long"),
  authorBio: z.string().min(50, "Author bio must be at least 50 characters").max(500, "Bio too long"),
  targetAudience: z.string().min(20, "Target audience description required").max(300, "Description too long"),
  marketingPlan: z.string().min(50, "Marketing plan required").max(1000, "Plan too long").optional(),
})

// POST create new submission
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session) {
      return NextResponse.json(
        { success: false, error: "Authentication required" },
        { status: 401 }
      )
    }

    const body = await request.json()
    const submissionData = submissionSchema.parse(body)

    // Check if user has author profile, create if not exists
    let authorProfile = await db
      .select()
      .from(authorProfiles)
      .where(eq(authorProfiles.userId, session.user.id))
      .limit(1)

    if (!authorProfile.length) {
      // Create basic author profile
      await db.insert(authorProfiles).values({
        userId: session.user.id,
        displayName: session.user.name || 'Author',
        bio: submissionData.authorBio,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
    }

    // Create submission
    const submission = await db.insert(bookSubmissions).values({
      authorId: session.user.id,
      ...submissionData,
      status: 'draft',
      submissionFee: 5000.00, // ₦5,000 submission fee
      feePaymentStatus: 'pending',
      createdAt: new Date(),
      updatedAt: new Date(),
    }).returning()

    return NextResponse.json({
      success: true,
      data: submission[0],
      message: "Submission created successfully. Please proceed to payment to submit for review."
    }, { status: 201 })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: "Invalid input", details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error creating submission:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create submission' },
      { status: 500 }
    )
  }
}
