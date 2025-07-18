import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { categories } from "@/lib/db/schema"
import { eq } from "drizzle-orm"

const updateCategorySchema = z.object({
  name: z.string().min(1, "Category name is required").optional(),
  description: z.string().optional(),
  color: z.string().optional(),
  isActive: z.boolean().optional(),
})

// GET /api/categories/[id] - Get single category
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const category = await db
      .select()
      .from(categories)
      .where(eq(categories.id, params.id))
      .limit(1)

    if (!category[0]) {
      return NextResponse.json(
        { success: false, error: "Category not found" },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: category[0]
    })
  } catch (error) {
    console.error("Error fetching category:", error)
    return NextResponse.json(
      { success: false, error: "Failed to fetch category" },
      { status: 500 }
    )
  }
}

// PUT /api/categories/[id] - Update category (admin only)
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()
    
    if (!session || session.user.role !== "admin") {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      )
    }

    // Check if category exists
    const existingCategory = await db
      .select()
      .from(categories)
      .where(eq(categories.id, params.id))
      .limit(1)

    if (!existingCategory[0]) {
      return NextResponse.json(
        { success: false, error: "Category not found" },
        { status: 404 }
      )
    }

    const body = await request.json()
    const updateData = updateCategorySchema.parse(body)

    // Generate new slug if name is being updated
    const updateFields: any = { ...updateData }
    if (updateData.name) {
      const newSlug = generateSlug(updateData.name)
      
      // Check if new slug conflicts with existing categories
      const conflictingCategory = await db
        .select()
        .from(categories)
        .where(eq(categories.slug, newSlug))
        .limit(1)

      if (conflictingCategory[0] && conflictingCategory[0].id !== params.id) {
        return NextResponse.json(
          { success: false, error: "Category with this name already exists" },
          { status: 400 }
        )
      }

      updateFields.slug = newSlug
    }

    const updatedCategory = await db
      .update(categories)
      .set(updateFields)
      .where(eq(categories.id, params.id))
      .returning()

    return NextResponse.json({
      success: true,
      data: updatedCategory[0],
      message: "Category updated successfully"
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: "Invalid input", details: error.errors },
        { status: 400 }
      )
    }

    console.error("Error updating category:", error)
    return NextResponse.json(
      { success: false, error: "Failed to update category" },
      { status: 500 }
    )
  }
}

// DELETE /api/categories/[id] - Delete category (admin only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()
    
    if (!session || session.user.role !== "admin") {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      )
    }

    // Check if category exists
    const existingCategory = await db
      .select()
      .from(categories)
      .where(eq(categories.id, params.id))
      .limit(1)

    if (!existingCategory[0]) {
      return NextResponse.json(
        { success: false, error: "Category not found" },
        { status: 404 }
      )
    }

    // TODO: In production, check if category is being used by books/blog posts
    // and handle accordingly (prevent deletion or reassign)

    await db.delete(categories).where(eq(categories.id, params.id))

    return NextResponse.json({
      success: true,
      message: "Category deleted successfully"
    })
  } catch (error) {
    console.error("Error deleting category:", error)
    return NextResponse.json(
      { success: false, error: "Failed to delete category" },
      { status: 500 }
    )
  }
}

// Helper function to generate slug from name
function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9 -]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim()
}
