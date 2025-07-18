import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { categories } from "@/lib/db/schema"
import { eq, desc, like, and } from "drizzle-orm"

const categorySchema = z.object({
  name: z.string().min(1, "Category name is required"),
  description: z.string().optional(),
  type: z.enum(["book", "blog"]),
  color: z.string().optional(),
  isActive: z.boolean().default(true),
})

// GET /api/categories - Get all categories (with filtering)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get("type") // book or blog
    const search = searchParams.get("search")
    const isActive = searchParams.get("active")

    let query = db.select().from(categories)

    // Build where conditions
    const conditions = []
    
    if (type) {
      conditions.push(eq(categories.type, type as any))
    }
    
    if (search) {
      conditions.push(like(categories.name, `%${search}%`))
    }

    if (isActive !== null) {
      conditions.push(eq(categories.isActive, isActive === "true"))
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions))
    }

    const categoryList = await query.orderBy(categories.name)

    return NextResponse.json({
      success: true,
      data: categoryList
    })
  } catch (error) {
    console.error("Error fetching categories:", error)
    return NextResponse.json(
      { success: false, error: "Failed to fetch categories" },
      { status: 500 }
    )
  }
}

// POST /api/categories - Create new category (admin only)
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session || session.user.role !== "admin") {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      )
    }

    const body = await request.json()
    const categoryData = categorySchema.parse(body)

    // Generate slug from name
    const slug = generateSlug(categoryData.name)

    // Check if slug already exists
    const existingCategory = await db
      .select()
      .from(categories)
      .where(eq(categories.slug, slug))
      .limit(1)

    if (existingCategory[0]) {
      return NextResponse.json(
        { success: false, error: "Category with this name already exists" },
        { status: 400 }
      )
    }

    const newCategory = await db.insert(categories)
      .values({
        ...categoryData,
        slug,
      })
      .returning()

    return NextResponse.json({
      success: true,
      data: newCategory[0],
      message: "Category created successfully"
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: "Invalid input", details: error.errors },
        { status: 400 }
      )
    }

    console.error("Error creating category:", error)
    return NextResponse.json(
      { success: false, error: "Failed to create category" },
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
