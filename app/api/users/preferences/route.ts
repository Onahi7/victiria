import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { userPreferences } from "@/lib/db/schema"
import { eq } from "drizzle-orm"

const preferencesSchema = z.object({
  theme: z.enum(["light", "dark", "system"]).optional(),
  emailNotifications: z.object({
    marketing: z.boolean().optional(),
    bookUpdates: z.boolean().optional(),
    orderUpdates: z.boolean().optional(),
    blogUpdates: z.boolean().optional(),
  }).optional(),
  privacySettings: z.object({
    profileVisible: z.boolean().optional(),
    showReadingProgress: z.boolean().optional(),
    allowRecommendations: z.boolean().optional(),
  }).optional(),
  readingPreferences: z.object({
    favoriteGenres: z.array(z.string()).optional(),
    readingGoals: z.object({
      booksPerMonth: z.number().min(0).optional(),
      minutesPerDay: z.number().min(0).optional(),
    }).optional(),
  }).optional(),
  language: z.string().optional(),
  timezone: z.string().optional(),
})

// GET /api/users/preferences - Get user preferences
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      )
    }

    // Get user preferences
    const preferences = await db
      .select()
      .from(userPreferences)
      .where(eq(userPreferences.userId, session.user.id))
      .limit(1)

    // If no preferences exist, return default values
    if (!preferences[0]) {
      const defaultPreferences = {
        userId: session.user.id,
        theme: "system",
        emailNotifications: {
          marketing: true,
          bookUpdates: true,
          orderUpdates: true,
          blogUpdates: false,
        },
        privacySettings: {
          profileVisible: true,
          showReadingProgress: true,
          allowRecommendations: true,
        },
        readingPreferences: {
          favoriteGenres: [],
          readingGoals: {
            booksPerMonth: 0,
            minutesPerDay: 0,
          },
        },
        language: "en",
        timezone: "UTC",
      }

      return NextResponse.json({
        success: true,
        data: defaultPreferences
      })
    }

    return NextResponse.json({
      success: true,
      data: preferences[0]
    })
  } catch (error) {
    console.error("Error fetching user preferences:", error)
    return NextResponse.json(
      { success: false, error: "Failed to fetch preferences" },
      { status: 500 }
    )
  }
}

// PUT /api/users/preferences - Update user preferences
export async function PUT(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      )
    }

    const body = await request.json()
    const updateData = preferencesSchema.parse(body)

    // Check if preferences exist
    const existingPreferences = await db
      .select()
      .from(userPreferences)
      .where(eq(userPreferences.userId, session.user.id))
      .limit(1)

    let updatedPreferences

    if (existingPreferences[0]) {
      // Update existing preferences
      updatedPreferences = await db
        .update(userPreferences)
        .set({
          ...updateData,
          updatedAt: new Date(),
        })
        .where(eq(userPreferences.userId, session.user.id))
        .returning()
    } else {
      // Create new preferences
      updatedPreferences = await db
        .insert(userPreferences)
        .values({
          userId: session.user.id,
          theme: "system",
          emailNotifications: {
            marketing: true,
            bookUpdates: true,
            orderUpdates: true,
            blogUpdates: false,
          },
          privacySettings: {
            profileVisible: true,
            showReadingProgress: true,
            allowRecommendations: true,
          },
          readingPreferences: {
            favoriteGenres: [],
            readingGoals: {
              booksPerMonth: 0,
              minutesPerDay: 0,
            },
          },
          language: "en",
          timezone: "UTC",
          ...updateData,
        })
        .returning()
    }

    return NextResponse.json({
      success: true,
      data: updatedPreferences[0],
      message: "Preferences updated successfully"
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: "Invalid input", details: error.errors },
        { status: 400 }
      )
    }

    console.error("Error updating user preferences:", error)
    return NextResponse.json(
      { success: false, error: "Failed to update preferences" },
      { status: 500 }
    )
  }
}

// DELETE /api/users/preferences - Reset preferences to default
export async function DELETE(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      )
    }

    // Delete existing preferences (will fall back to defaults)
    await db
      .delete(userPreferences)
      .where(eq(userPreferences.userId, session.user.id))

    return NextResponse.json({
      success: true,
      message: "Preferences reset to default"
    })
  } catch (error) {
    console.error("Error resetting user preferences:", error)
    return NextResponse.json(
      { success: false, error: "Failed to reset preferences" },
      { status: 500 }
    )
  }
}
