import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { users, verificationTokens } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { Resend } from "resend"
import crypto from "crypto"

const resend = new Resend(process.env.RESEND_API_KEY)

const sendVerificationSchema = z.object({
  email: z.string().email("Invalid email address"),
})

const verifyEmailSchema = z.object({
  token: z.string().min(1, "Token is required"),
})

// POST /api/auth/send-verification - Send email verification
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email } = sendVerificationSchema.parse(body)

    // Check if user exists
    const user = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1)

    if (!user[0]) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      )
    }

    // Check if email is already verified
    if (user[0].emailVerified) {
      return NextResponse.json(
        { success: false, error: "Email is already verified" },
        { status: 400 }
      )
    }

    // Generate verification token
    const token = crypto.randomBytes(32).toString("hex")
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours

    // Delete any existing tokens for this user
    await db
      .delete(verificationTokens)
      .where(eq(verificationTokens.identifier, email))

    // Create new verification token
    await db.insert(verificationTokens).values({
      identifier: email,
      token,
      expires,
    })

    // Send verification email
    const verificationUrl = `${process.env.NEXTAUTH_URL}/verify-email?token=${token}`
    
    await resend.emails.send({
      from: process.env.FROM_EMAIL || "noreply@edifybooks.com",
      to: email,
      subject: "Verify your email address",
      html: `
        <div style="max-width: 600px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif;">
          <h2 style="color: #333; text-align: center;">Verify Your Email Address</h2>
          <p>Hello ${user[0].name},</p>
          <p>Thank you for registering with EdifyPub. To complete your registration, please verify your email address by clicking the button below:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${verificationUrl}" style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">Verify Email</a>
          </div>
          <p>Or copy and paste this link into your browser:</p>
          <p style="word-break: break-all; color: #666;">${verificationUrl}</p>
          <p>This link will expire in 24 hours.</p>
          <p>If you didn't request this verification, please ignore this email.</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
          <p style="color: #666; font-size: 12px; text-align: center;">Victoria Team</p>
        </div>
      `,
    })

    return NextResponse.json({
      success: true,
      message: "Verification email sent successfully"
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: "Invalid input", details: error.errors },
        { status: 400 }
      )
    }

    console.error("Error sending verification email:", error)
    return NextResponse.json(
      { success: false, error: "Failed to send verification email" },
      { status: 500 }
    )
  }
}

// PUT /api/auth/verify-email - Verify email with token
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { token } = verifyEmailSchema.parse(body)

    // Find verification token
    const verificationToken = await db
      .select()
      .from(verificationTokens)
      .where(eq(verificationTokens.token, token))
      .limit(1)

    if (!verificationToken[0]) {
      return NextResponse.json(
        { success: false, error: "Invalid or expired token" },
        { status: 400 }
      )
    }

    // Check if token is expired
    if (verificationToken[0].expires < new Date()) {
      await db
        .delete(verificationTokens)
        .where(eq(verificationTokens.token, token))
      
      return NextResponse.json(
        { success: false, error: "Token has expired" },
        { status: 400 }
      )
    }

    // Update user email verification status
    await db
      .update(users)
      .set({ emailVerified: new Date() })
      .where(eq(users.email, verificationToken[0].identifier))

    // Delete the used token
    await db
      .delete(verificationTokens)
      .where(eq(verificationTokens.token, token))

    return NextResponse.json({
      success: true,
      message: "Email verified successfully"
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: "Invalid input", details: error.errors },
        { status: 400 }
      )
    }

    console.error("Error verifying email:", error)
    return NextResponse.json(
      { success: false, error: "Failed to verify email" },
      { status: 500 }
    )
  }
}
