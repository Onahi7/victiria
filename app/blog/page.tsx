import { Metadata } from 'next'
import { db } from '@/lib/db'
import { blogPosts, users } from '@/lib/db/schema'
import { eq, desc, like, and, or } from 'drizzle-orm'
import BlogPostCard from '@/components/blog-post-card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Search, BookOpen, Calendar, Tag } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Blog | EdifyPub - Writing, Publishing & Literary Insights',
  description: 'Explore expert insights, practical tips, and inspiring stories about writing, publishing, and the creative journey. Stay updated with the latest trends in the literary world.',
  keywords: 'writing blog, publishing tips, author resources, creative writing, book publishing, literary insights, writing advice, publishing industry',
  authors: [{ name: 'EdifyPub Team' }],
  creator: 'EdifyPub',
  publisher: 'EdifyPub',
  alternates: {
    canonical: 'https://edifypub.com/blog',
  },
  openGraph: {
    type: 'website',
    url: 'https://edifypub.com/blog',
    title: 'EdifyPub Blog - Writing & Publishing Insights',
    description: 'Read the latest insights, tips, and stories from EdifyPub about writing, publishing, and the creative journey.',
    siteName: 'EdifyPub',
    locale: 'en_US',
    images: [
      {
        url: '/edlogo.jpg',
        width: 1200,
        height: 630,
        alt: 'EdifyPub Blog',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    site: '@edifypub',
    creator: '@edifypub',
    title: 'EdifyPub Blog - Writing & Publishing Insights',
    description: 'Read the latest insights, tips, and stories from EdifyPub about writing, publishing, and the creative journey.',
    images: ['/edlogo.jpg'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
}

interface BlogPost {
  id: string
  title: string
  excerpt: string | null
  slug: string
  coverImage: string | null
  category: string | null
  tags: string[]
  status: 'draft' | 'published' | 'archived'
  publishedAt: string | null
  createdAt: string
  updatedAt: string
  author: {
    id: string
    name: string
    avatar: string | null
  } | null
}

async function getBlogPosts(searchParams: any) {
  const params = await searchParams
  const { search, category, page = 1 } = params
  const limit = 12
  const offset = (page - 1) * limit

  let query = db
    .select({
      id: blogPosts.id,
      title: blogPosts.title,
      excerpt: blogPosts.excerpt,
      slug: blogPosts.slug,
      coverImage: blogPosts.coverImage,
      category: blogPosts.category,
      tags: blogPosts.tags,
      status: blogPosts.status,
      publishedAt: blogPosts.publishedAt,
      createdAt: blogPosts.createdAt,
      updatedAt: blogPosts.updatedAt,
      author: {
        id: users.id,
        name: users.name,
        avatar: users.avatar,
      },
    })
    .from(blogPosts)
    .leftJoin(users, eq(blogPosts.authorId, users.id))

  const conditions = [eq(blogPosts.status, 'published')]

  if (search) {
    const searchCondition = or(
      like(blogPosts.title, `%${search}%`),
      like(blogPosts.excerpt, `%${search}%`),
      like(blogPosts.content, `%${search}%`)
    )
    if (searchCondition) {
      conditions.push(searchCondition)
    }
  }

  if (category && category !== 'all') {
    conditions.push(eq(blogPosts.category, category))
  }

  const posts = await query
    .where(and(...conditions))
    .orderBy(desc(blogPosts.publishedAt))
    .limit(limit)
    .offset(offset)

  return posts.map(post => ({
    ...post,
    tags: Array.isArray(post.tags) ? post.tags : [],
    publishedAt: post.publishedAt ? post.publishedAt.toISOString() : null,
    createdAt: post.createdAt.toISOString(),
    updatedAt: post.updatedAt.toISOString(),
  }))
}

async function getCategories() {
  const categories = await db
    .selectDistinct({ category: blogPosts.category })
    .from(blogPosts)
    .where(eq(blogPosts.status, 'published'))

  return categories.map(c => c.category).filter(Boolean)
}

async function getFeaturedPost() {
  const featured = await db
    .select({
      id: blogPosts.id,
      title: blogPosts.title,
      excerpt: blogPosts.excerpt,
      slug: blogPosts.slug,
      coverImage: blogPosts.coverImage,
      category: blogPosts.category,
      tags: blogPosts.tags,
      publishedAt: blogPosts.publishedAt,
      author: {
        id: users.id,
        name: users.name,
        avatar: users.avatar,
      },
    })
    .from(blogPosts)
    .leftJoin(users, eq(blogPosts.authorId, users.id))
    .where(eq(blogPosts.status, 'published'))
    .orderBy(desc(blogPosts.publishedAt))
    .limit(1)

  return featured[0] ? {
    ...featured[0],
    tags: Array.isArray(featured[0].tags) ? featured[0].tags : [],
    publishedAt: featured[0].publishedAt ? featured[0].publishedAt.toISOString() : null,
  } : null
}

export default async function BlogPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const params = await searchParams
  const posts = await getBlogPosts(searchParams)
  const categories = await getCategories()
  const featuredPost = await getFeaturedPost()

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <section className="bg-gradient-to-br from-purple-600 to-pink-600 text-white py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
              The Blog
            </h1>
            <p className="text-xl md:text-2xl text-purple-100 max-w-2xl mx-auto">
              Insights, stories, and inspiration from the world of writing and publishing
            </p>
          </div>
        </div>
      </section>

      {/* Featured Post */}
      {featuredPost && (
        <section className="py-16 bg-white dark:bg-gray-800">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto">
              <div className="text-center mb-8">
                <Badge className="mb-4 bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
                  Featured Post
                </Badge>
                <h2 className="text-3xl md:text-4xl font-bold mb-4">
                  {featuredPost.title}
                </h2>
                <p className="text-gray-600 dark:text-gray-300 text-lg">
                  {featuredPost.excerpt}
                </p>
              </div>
              <BlogPostCard post={featuredPost} featured />
            </div>
          </div>
        </section>
      )}

      {/* Search and Filter */}
      <section className="py-8 bg-gray-100 dark:bg-gray-900">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <div className="flex flex-col md:flex-row gap-4 items-center">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search blog posts..."
                  className="pl-10"
                  defaultValue={params.search as string}
                />
              </div>
              <div className="flex gap-2 flex-wrap">
                <Badge
                  variant={!params.category || params.category === 'all' ? 'default' : 'secondary'}
                  className="cursor-pointer"
                >
                  All
                </Badge>
                {categories.map((category) => (
                  <Badge
                    key={category}
                    variant={params.category === category ? 'default' : 'secondary'}
                    className="cursor-pointer"
                  >
                    {category}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Blog Posts */}
      <section className="py-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-6xl mx-auto">
            {posts.length === 0 ? (
              <div className="text-center py-16">
                <BookOpen className="mx-auto h-16 w-16 text-gray-400 mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  No blog posts found
                </h3>
                <p className="text-gray-600 dark:text-gray-300">
                  Try adjusting your search or filter criteria.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {posts.map((post) => (
                  <BlogPostCard key={post.id} post={post} />
                ))}
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  )
}
