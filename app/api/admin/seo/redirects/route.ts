import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { seoService } from '@/lib/seo/service'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const redirects = await seoService.getAllRedirects()
    return NextResponse.json(redirects)
  } catch (error) {
    console.error('Error fetching redirects:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { fromUrl, toUrl, statusCode } = body

    if (!fromUrl || !toUrl) {
      return NextResponse.json({ error: 'From URL and To URL are required' }, { status: 400 })
    }

    const id = await seoService.createRedirect(fromUrl, toUrl, statusCode)
    return NextResponse.json({ success: true, id })
  } catch (error) {
    console.error('Error creating redirect:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
