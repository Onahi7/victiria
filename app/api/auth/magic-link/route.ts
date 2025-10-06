import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { users, freeDownloads, newsletterSubscribers } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'
import { generateId } from '@/lib/utils'
import { sendEmail } from '@/lib/email/send-email'

// POST /api/auth/magic-link - Create account and send magic link for free book download
export async function POST(request: NextRequest) {
  try {
    const { name, email, phone, bookId } = await request.json()

    if (!name || !email || !bookId) {
      return NextResponse.json(
        { success: false, error: "Name, email, and book ID are required" },
        { status: 400 }
      )
    }

    // Check if user already exists
    let user = await db.query.users.findFirst({
      where: eq(users.email, email)
    })

    // If user doesn't exist, create a new one
    if (!user) {
      const [newUser] = await db.insert(users).values({
        email,
        name,
        phone: phone || null,
        role: 'reader',
        emailVerified: new Date(),
        isActive: true,
      }).returning()
      
      user = newUser

      // Add to newsletter subscribers if not already subscribed
      try {
        await db.insert(newsletterSubscribers).values({
          email,
          name,
          phone: phone || null,
          source: 'free_download',
          status: 'active',
        }).onConflictDoNothing()
      } catch (error) {
        console.log("Newsletter subscription failed (user might already exist):", error)
      }
    } else {
      // Update user info if phone is provided and not already set
      if (phone && !user.phone) {
        await db.update(users)
          .set({ phone })
          .where(eq(users.id, user.id))
      }
    }

    // Check if they've already downloaded this book
    const existingDownload = await db.query.freeDownloads.findFirst({
      where: and(
        eq(freeDownloads.userId, user.id),
        eq(freeDownloads.bookId, bookId)
      )
    })

    if (!existingDownload) {
      // Record the download
      const userAgent = request.headers.get('user-agent') || ''
      const forwarded = request.headers.get('x-forwarded-for')
      const ipAddress = forwarded ? forwarded.split(',')[0] : ''

      await db.insert(freeDownloads).values({
        userId: user.id,
        bookId,
        ipAddress,
        userAgent,
        source: 'direct',
      })
    }

    // Generate a magic link token (in a real app, store this in a tokens table)
    const token = generateId()
    const magicLink = `${process.env.NEXTAUTH_URL}/auth/verify?token=${token}&email=${encodeURIComponent(email)}&bookId=${bookId}`

    // Send magic link email
    try {
      await sendEmail({
        to: email,
        subject: "Your Free Book Download Link",
        html: `
          <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif;">
            <h2 style="color: #333;">Thank you for your interest!</h2>
            <p>Hi ${name},</p>
            <p>Thank you for requesting your free book. Click the button below to access your download:</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${magicLink}" 
                 style="background-color: #4F46E5; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; display: inline-block;">
                Download Your Free Book
              </a>
            </div>
            <p style="color: #666; font-size: 14px;">
              This link will expire in 24 hours. If you're having trouble clicking the button, copy and paste this link into your browser:
            </p>
            <p style="word-break: break-all; color: #666; font-size: 12px;">${magicLink}</p>
            <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
            <p style="color: #999; font-size: 12px;">
              You're receiving this email because you requested a free book download from Victoria Ashworth.
              You've also been subscribed to our newsletter for updates on new books and writing tips.
            </p>
          </div>
        `
      })
    } catch (emailError) {
      console.error("Failed to send magic link email:", emailError)
      // Don't fail the request if email fails
    }

    return NextResponse.json({
      success: true,
      message: "Account created successfully! Check your email for the download link.",
      data: {
        userId: user.id,
        email: user.email,
        name: user.name,
        downloadRecorded: !existingDownload
      }
    })

  } catch (error) {
    console.error("Error creating magic link:", error)
    return NextResponse.json(
      { success: false, error: "Failed to process request" },
      { status: 500 }
    )
  }
}
