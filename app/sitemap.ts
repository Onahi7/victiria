import { MetadataRoute } from 'next'
import { db } from '@/lib/db'
import { blogPosts, books } from '@/lib/db/schema'
import { eq, desc } from 'drizzle-orm'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://edifypub.com' // Replace with your actual domain

  let posts: Array<{ slug: string; updatedAt: Date | null }> = []
  let publishedBooks: Array<{ slug: string; updatedAt: Date | null }> = []

  // Try to get dynamic content from database, but don't fail if DB is unavailable
  try {
    // Get all published blog posts
    posts = await db
      .select({
        slug: blogPosts.slug,
        updatedAt: blogPosts.updatedAt,
      })
      .from(blogPosts)
      .where(eq(blogPosts.status, 'published'))
      .orderBy(desc(blogPosts.updatedAt))

    // Get all published books
    publishedBooks = await db
      .select({
        slug: books.slug,
        updatedAt: books.updatedAt,
      })
      .from(books)
      .where(eq(books.status, 'published'))
  } catch (error) {
    // If database is unavailable during build, just return static pages
    console.warn('Database unavailable during sitemap generation, returning static pages only')
  }

  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${baseUrl}/about`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/books`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/blog`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/academy`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/services`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/publishing`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/preorders`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
  ]

  // Blog post pages
  const blogPages: MetadataRoute.Sitemap = posts.map((post) => ({
    url: `${baseUrl}/blog/${post.slug}`,
    lastModified: post.updatedAt ?? undefined,
    changeFrequency: 'weekly' as const,
    priority: 0.7,
  }))

  // Book pages
  const bookPages: MetadataRoute.Sitemap = publishedBooks.map((book) => ({
    url: `${baseUrl}/books/${book.slug}`,
    lastModified: book.updatedAt ?? undefined,
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }))

  return [...staticPages, ...blogPages, ...bookPages]
}
