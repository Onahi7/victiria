import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import ImageKit from "imagekit"

// Initialize ImageKit
const imagekit = new ImageKit({
  publicKey: process.env.IMAGEKIT_PUBLIC_KEY!,
  privateKey: process.env.IMAGEKIT_PRIVATE_KEY!,
  urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT!,
})

// POST /api/upload/image - Upload image to ImageKit (alias for /api/upload)
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      )
    }

    const formData = await request.formData()
    const file = formData.get("file") as File
    const folder = formData.get("folder") as string || "images"
    
    if (!file) {
      return NextResponse.json(
        { success: false, error: "No file provided" },
        { status: 400 }
      )
    }

    // Validate file type for images
    if (!file.type.startsWith('image/')) {
      return NextResponse.json(
        { success: false, error: "Only image files are allowed" },
        { status: 400 }
      )
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Generate unique filename
    const timestamp = Date.now()
    const fileName = `${timestamp}_${file.name.replace(/[^a-zA-Z0-9.]/g, "_")}`

    // Upload to ImageKit
    const result = await imagekit.upload({
      file: buffer,
      fileName,
      folder: `edifypub/${folder}`,
      useUniqueFileName: true,
      tags: [`user:${session.user.id}`, `folder:${folder}`, "type:image"],
    })

    // Return both formats for compatibility
    return NextResponse.json({
      success: true,
      url: result.url, // For components expecting url directly
      data: {
        url: result.url,
        fileId: result.fileId,
        fileName: result.name,
        size: result.size,
        filePath: result.filePath,
      },
      message: "Image uploaded successfully"
    })
  } catch (error) {
    console.error("Error uploading image:", error)
    return NextResponse.json(
      { success: false, error: "Failed to upload image" },
      { status: 500 }
    )
  }
}
