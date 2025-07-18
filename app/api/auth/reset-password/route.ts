import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { db } from "@/lib/db"
import { users, verificationTokens } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { Resend } from "resend"
import bcrypt from "bcryptjs"
import crypto from "crypto"

const resend = new Resend(process.env.RESEND_API_KEY)

const forgotPasswordSchema = z.object({
  email: z.string().email("Invalid email address"),
})

const resetPasswordSchema = z.object({
  token: z.string().min(1, "Token is required"),
  password: z.string().min(8, "Password must be at least 8 characters"),
})

// POST /api/auth/forgot-password - Send password reset email
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email } = forgotPasswordSchema.parse(body)

    // Check if user exists
    const user = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1)

    if (!user[0]) {
      // Don't reveal if email exists or not for security
      return NextResponse.json({
        success: true,
        message: "If an account with that email exists, a password reset link has been sent"
      })
    }

    // Generate reset token
    const token = crypto.randomBytes(32).toString("hex")
    const expires = new Date(Date.now() + 60 * 60 * 1000) // 1 hour

    // Delete any existing reset tokens for this user
    await db
      .delete(verificationTokens)
      .where(eq(verificationTokens.identifier, `reset_${email}`))

    // Create new reset token
    await db.insert(verificationTokens).values({
      identifier: `reset_${email}`,
      token,
      expires,
    })

    // Send reset email
    const resetUrl = `${process.env.NEXTAUTH_URL}/reset-password?token=${token}`
    
    await resend.emails.send({
      from: process.env.FROM_EMAIL || "noreply@edifybooks.com",
      to: email,
      subject: "Reset your password",
      html: `
        <div style="max-width: 600px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif;">
          <h2 style="color: #333; text-align: center;">Reset Your Password</h2>
          <p>Hello ${user[0].name},</p>
          <p>We received a request to reset your password. If you didn't make this request, you can safely ignore this email.</p>
          <p>To reset your password, click the button below:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" style="background-color: #dc3545; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">Reset Password</a>
          </div>
          <p>Or copy and paste this link into your browser:</p>
          <p style="word-break: break-all; color: #666;">${resetUrl}</p>
          <p>This link will expire in 1 hour.</p>
          <p>If you continue to have problems, please contact our support team.</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
          <p style="color: #666; font-size: 12px; text-align: center;">Victoria Team</p>
        </div>
      `,
    })

    return NextResponse.json({
      success: true,
      message: "If an account with that email exists, a password reset link has been sent"
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: "Invalid input", details: error.errors },
        { status: 400 }
      )
    }

    console.error("Error sending password reset email:", error)
    return NextResponse.json(
      { success: false, error: "Failed to send password reset email" },
      { status: 500 }
    )
  }
}

// PUT /api/auth/reset-password - Reset password with token
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { token, password } = resetPasswordSchema.parse(body)

    // Find reset token
    const resetToken = await db
      .select()
      .from(verificationTokens)
      .where(eq(verificationTokens.token, token))
      .limit(1)

    if (!resetToken[0] || !resetToken[0].identifier.startsWith("reset_")) {
      return NextResponse.json(
        { success: false, error: "Invalid or expired token" },
        { status: 400 }
      )
    }

    // Check if token is expired
    if (resetToken[0].expires < new Date()) {
      await db
        .delete(verificationTokens)
        .where(eq(verificationTokens.token, token))
      
      return NextResponse.json(
        { success: false, error: "Token has expired" },
        { status: 400 }
      )
    }

    // Extract email from identifier
    const email = resetToken[0].identifier.replace("reset_", "")

    // Hash new password
    const hashedPassword = await bcrypt.hash(password, 12)

    // Update user password
    await db
      .update(users)
      .set({ password: hashedPassword })
      .where(eq(users.email, email))

    // Delete the used token
    await db
      .delete(verificationTokens)
      .where(eq(verificationTokens.token, token))

    return NextResponse.json({
      success: true,
      message: "Password reset successfully"
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: "Invalid input", details: error.errors },
        { status: 400 }
      )
    }

    console.error("Error resetting password:", error)
    return NextResponse.json(
      { success: false, error: "Failed to reset password" },
      { status: 500 }
    )
  }
}
