import { MetadataRoute } from 'next'
import { db } from '@/lib/db'
import { blogPosts, books } from '@/lib/db/schema'
import { eq, desc } from 'drizzle-orm'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://edifypub.com' // Replace with your actual domain

  // Get all published blog posts
  const posts = await db
    .select({
      slug: blogPosts.slug,
      updatedAt: blogPosts.updatedAt,
    })
    .from(blogPosts)
    .where(eq(blogPosts.status, 'published'))
    .orderBy(desc(blogPosts.updatedAt))

  // Get all published books
  const publishedBooks = await db
    .select({
      slug: books.slug,
      updatedAt: books.updatedAt,
    })
    .from(books)
    .where(eq(books.status, 'published'))

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
    lastModified: post.updatedAt,
    changeFrequency: 'weekly' as const,
    priority: 0.7,
  }))

  // Book pages
  const bookPages: MetadataRoute.Sitemap = publishedBooks.map((book) => ({
    url: `${baseUrl}/books/${book.slug}`,
    lastModified: book.updatedAt,
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }))

  return [...staticPages, ...blogPages, ...bookPages]
}
