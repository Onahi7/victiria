import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { seoService } from '@/lib/seo/service'
import { db } from '@/lib/db'
import { books, blogPosts, courses } from '@/lib/db/schema'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const baseUrl = 'https://edifybooks.com'
    const sitemapEntries = []

    // Static pages
    const staticPages = [
      { url: baseUrl, priority: 1.0, changefreq: 'daily' },
      { url: `${baseUrl}/books`, priority: 0.9, changefreq: 'daily' },
      { url: `${baseUrl}/blog`, priority: 0.8, changefreq: 'daily' },
      { url: `${baseUrl}/academy`, priority: 0.8, changefreq: 'weekly' },
      { url: `${baseUrl}/about`, priority: 0.6, changefreq: 'monthly' },
      { url: `${baseUrl}/contact`, priority: 0.5, changefreq: 'monthly' },
      { url: `${baseUrl}/publishing`, priority: 0.8, changefreq: 'weekly' },
      { url: `${baseUrl}/services`, priority: 0.7, changefreq: 'weekly' },
    ]

    sitemapEntries.push(...staticPages.map(page => ({
      url: page.url,
      lastmod: new Date(),
      changefreq: page.changefreq,
      priority: page.priority,
      pageType: 'static',
    })))

    // Dynamic pages - Books
    try {
      const allBooks = await db.select({
        slug: books.slug,
        updatedAt: books.updatedAt,
      }).from(books).where(eq(books.status, 'published'))

      sitemapEntries.push(...allBooks.map(book => ({
        url: `${baseUrl}/books/${book.slug}`,
        lastmod: book.updatedAt,
        changefreq: 'weekly',
        priority: 0.8,
        pageType: 'book',
      })))
    } catch (error) {
      console.error('Error fetching books for sitemap:', error)
    }

    // Dynamic pages - Blog Posts
    try {
      const allPosts = await db.select({
        slug: blogPosts.slug,
        updatedAt: blogPosts.updatedAt,
      }).from(blogPosts).where(eq(blogPosts.status, 'published'))

      sitemapEntries.push(...allPosts.map(post => ({
        url: `${baseUrl}/blog/${post.slug}`,
        lastmod: post.updatedAt,
        changefreq: 'weekly',
        priority: 0.7,
        pageType: 'blog-post',
      })))
    } catch (error) {
      console.error('Error fetching blog posts for sitemap:', error)
    }

    // Dynamic pages - Courses
    try {
      const allCourses = await db.select({
        slug: courses.slug,
        updatedAt: courses.updatedAt,
      }).from(courses).where(eq(courses.status, 'published'))

      sitemapEntries.push(...allCourses.map(course => ({
        url: `${baseUrl}/academy/courses/${course.slug}`,
        lastmod: course.updatedAt,
        changefreq: 'weekly',
        priority: 0.7,
        pageType: 'course',
      })))
    } catch (error) {
      console.error('Error fetching courses for sitemap:', error)
    }

    // Update sitemap in database
    await seoService.updateSitemap(sitemapEntries)

    // Generate XML sitemap
    const sitemapXml = generateSitemapXml(sitemapEntries)

    // Save to public folder (you might want to use a file storage service instead)
    const fs = require('fs').promises
    const path = require('path')
    
    try {
      await fs.writeFile(
        path.join(process.cwd(), 'public', 'sitemap.xml'),
        sitemapXml
      )
    } catch (error) {
      console.error('Error writing sitemap file:', error)
    }

    return NextResponse.json({ 
      success: true, 
      entriesCount: sitemapEntries.length,
      message: 'Sitemap generated successfully'
    })
  } catch (error) {
    console.error('Error generating sitemap:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

function generateSitemapXml(entries: any[]) {
  const xmlHeader = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`
  
  const xmlFooter = `</urlset>`
  
  const xmlEntries = entries.map(entry => `
  <url>
    <loc>${entry.url}</loc>
    <lastmod>${entry.lastmod.toISOString()}</lastmod>
    <changefreq>${entry.changefreq}</changefreq>
    <priority>${entry.priority}</priority>
  </url>`).join('')

  return xmlHeader + xmlEntries + xmlFooter
}

export async function GET(request: NextRequest) {
  try {
    const sitemap = await seoService.getSitemap()
    return NextResponse.json(sitemap)
  } catch (error) {
    console.error('Error getting sitemap:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
