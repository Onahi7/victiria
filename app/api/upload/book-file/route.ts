import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session || session.user.role !== "admin") {
      return NextResponse.json(
        { success: false, error: "Unauthorized. Admin access required." },
        { status: 401 }
      )
    }

    const formData = await request.formData()
    const file = formData.get('file') as File
    const bookId = formData.get('bookId') as string
    const fileType = formData.get('fileType') as string // 'book' or 'cover'

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No file uploaded' },
        { status: 400 }
      )
    }

    // Validate file type
    const allowedTypes = {
      book: ['application/pdf', 'application/epub+zip'],
      cover: ['image/jpeg', 'image/png', 'image/webp']
    }

    const currentFileType = fileType === 'book' ? 'book' : 'cover'
    if (!allowedTypes[currentFileType].includes(file.type)) {
      return NextResponse.json(
        { 
          success: false, 
          error: `Invalid file type. ${currentFileType === 'book' ? 'Only PDF and EPUB files are allowed for books' : 'Only JPEG, PNG, and WebP images are allowed for covers'}` 
        },
        { status: 400 }
      )
    }

    // Validate file size (50MB for books, 5MB for covers)
    const maxSize = currentFileType === 'book' ? 50 * 1024 * 1024 : 5 * 1024 * 1024
    if (file.size > maxSize) {
      return NextResponse.json(
        { 
          success: false, 
          error: `File too large. Maximum size is ${currentFileType === 'book' ? '50MB' : '5MB'}` 
        },
        { status: 400 }
      )
    }

    // Create uploads directory structure
    const uploadDir = join(process.cwd(), 'public', 'uploads', currentFileType === 'book' ? 'books' : 'covers')
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true })
    }

    // Generate unique filename
    const timestamp = Date.now()
    const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_')
    const fileName = `${bookId || timestamp}_${sanitizedFileName}`
    const filePath = join(uploadDir, fileName)

    // Save file
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    await writeFile(filePath, buffer)

    // Generate public URL
    const publicUrl = `/uploads/${currentFileType === 'book' ? 'books' : 'covers'}/${fileName}`

    return NextResponse.json({
      success: true,
      message: 'File uploaded successfully',
      fileName,
      fileUrl: publicUrl,
      fileSize: file.size,
      fileType: file.type,
      uploadedAt: new Date().toISOString()
    })

  } catch (error) {
    console.error('Error uploading file:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to upload file' },
      { status: 500 }
    )
  }
}
