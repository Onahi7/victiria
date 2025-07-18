import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import ImageKit from "imagekit"

// Initialize ImageKit
const imagekit = new ImageKit({
  publicKey: process.env.IMAGEKIT_PUBLIC_KEY!,
  privateKey: process.env.IMAGEKIT_PRIVATE_KEY!,
  urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT!,
})

// POST /api/upload - Upload file to ImageKit
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
    const folder = formData.get("folder") as string || "general"
    
    if (!file) {
      return NextResponse.json(
        { success: false, error: "No file provided" },
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
      tags: [`user:${session.user.id}`, `folder:${folder}`],
    })

    return NextResponse.json({
      success: true,
      data: {
        url: result.url,
        fileId: result.fileId,
        fileName: result.name,
        size: result.size,
        filePath: result.filePath,
      },
      message: "File uploaded successfully"
    })
  } catch (error) {
    console.error("Error uploading file:", error)
    return NextResponse.json(
      { success: false, error: "Failed to upload file" },
      { status: 500 }
    )
  }
}

// DELETE /api/upload - Delete file from ImageKit
export async function DELETE(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const fileId = searchParams.get("fileId")
    
    if (!fileId) {
      return NextResponse.json(
        { success: false, error: "File ID is required" },
        { status: 400 }
      )
    }

    // Delete from ImageKit
    await imagekit.deleteFile(fileId)

    return NextResponse.json({
      success: true,
      message: "File deleted successfully"
    })
  } catch (error) {
    console.error("Error deleting file:", error)
    return NextResponse.json(
      { success: false, error: "Failed to delete file" },
      { status: 500 }
    )
  }
}
