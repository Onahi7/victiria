import { notFound } from 'next/navigation'
import { Metadata } from 'next'
import { db } from '@/lib/db'
import { blogPosts, users } from '@/lib/db/schema'
import { eq, and, ne } from 'drizzle-orm'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Calendar, Clock, User, ArrowLeft, BookOpen, Tag } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import Link from 'next/link'
import Image from 'next/image'
import BlogPostCard from '@/components/blog-post-card'
import BlogSocialShare from '@/components/blog-social-share'
import BlogComments from '@/components/blog-comments'
import BlogStructuredData from '@/components/blog-structured-data'

interface BlogPost {
  id: string
  title: string
  content: string
  excerpt: string | null
  slug: string
  coverImage: string | null
  category: string | null
  tags: string[]
  status: 'draft' | 'published' | 'archived'
  publishedAt: string | null
  seoTitle: string | null
  seoDescription: string | null
  author: {
    id: string
    name: string
    avatar: string | null
  } | null
  createdAt: string
  updatedAt: string
}

async function getBlogPost(slug: string): Promise<BlogPost | null> {
  const posts = await db
    .select({
      id: blogPosts.id,
      title: blogPosts.title,
      content: blogPosts.content,
      excerpt: blogPosts.excerpt,
      slug: blogPosts.slug,
      coverImage: blogPosts.coverImage,
      category: blogPosts.category,
      tags: blogPosts.tags,
      status: blogPosts.status,
      publishedAt: blogPosts.publishedAt,
      seoTitle: blogPosts.seoTitle,
      seoDescription: blogPosts.seoDescription,
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
    .where(and(eq(blogPosts.slug, slug), eq(blogPosts.status, 'published')))
    .limit(1)

  return posts[0] ? {
    ...posts[0],
    tags: Array.isArray(posts[0].tags) ? posts[0].tags : [],
    publishedAt: posts[0].publishedAt ? posts[0].publishedAt.toISOString() : null,
    createdAt: posts[0].createdAt.toISOString(),
    updatedAt: posts[0].updatedAt.toISOString(),
  } : null
}

async function getRelatedPosts(postId: string, category: string | null): Promise<BlogPost[]> {
  const conditions = [ne(blogPosts.id, postId), eq(blogPosts.status, 'published')]
  
  if (category) {
    conditions.push(eq(blogPosts.category, category))
  }

  const posts = await db
    .select({
      id: blogPosts.id,
      title: blogPosts.title,
      content: blogPosts.content,
      excerpt: blogPosts.excerpt,
      slug: blogPosts.slug,
      coverImage: blogPosts.coverImage,
      category: blogPosts.category,
      tags: blogPosts.tags,
      status: blogPosts.status,
      publishedAt: blogPosts.publishedAt,
      seoTitle: blogPosts.seoTitle,
      seoDescription: blogPosts.seoDescription,
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
    .where(and(...conditions))
    .limit(3)

  return posts.map(post => ({
    ...post,
    tags: Array.isArray(post.tags) ? post.tags : [],
    publishedAt: post.publishedAt ? post.publishedAt.toISOString() : null,
    createdAt: post.createdAt.toISOString(),
    updatedAt: post.updatedAt.toISOString(),
  }))
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const post = await getBlogPost(slug)

  if (!post) {
    return {
      title: 'Blog Post Not Found',
      description: 'The requested blog post could not be found.',
    }
  }

  const url = 'https://edifypub.com' // Replace with your actual domain
  const ogImage = post.coverImage || '/edlogo.jpg'
  
  return {
    title: post.seoTitle || `${post.title} | EdifyPub Blog`,
    description: post.seoDescription || post.excerpt || `Read ${post.title} by ${post.author?.name || 'EdifyPub Team'}`,
    keywords: Array.isArray(post.tags) ? post.tags.join(', ') : undefined,
    authors: post.author ? [{ name: post.author.name }] : [{ name: 'EdifyPub Team' }],
    creator: post.author?.name || 'EdifyPub Team',
    publisher: 'EdifyPub',
    alternates: {
      canonical: `${url}/blog/${post.slug}`,
    },
    openGraph: {
      type: 'article',
      url: `${url}/blog/${post.slug}`,
      title: post.title,
      description: post.excerpt || 'Read this blog post by EdifyPub',
      siteName: 'EdifyPub',
      locale: 'en_US',
      publishedTime: post.publishedAt || undefined,
      modifiedTime: post.updatedAt,
      authors: post.author ? [post.author.name] : ['EdifyPub Team'],
      section: post.category || 'Publishing',
      tags: Array.isArray(post.tags) ? post.tags : undefined,
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: post.title,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      site: '@edifypub',
      creator: '@edifypub',
      title: post.title,
      description: post.excerpt || 'Read this blog post by EdifyPub',
      images: [ogImage],
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
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const post = await getBlogPost(slug)

  if (!post) {
    notFound()
  }

  const relatedPosts = await getRelatedPosts(post.id, post.category)
  const url = 'https://edifypub.com' // Replace with your actual domain

  const estimateReadTime = (content: string) => {
    const wordsPerMinute = 200
    const words = content.split(' ').length
    return Math.ceil(words / wordsPerMinute)
  }

  const getCategoryColor = (category: string | null) => {
    if (!category) return 'bg-gray-100 text-gray-800'
    
    const colors: Record<string, string> = {
      'writing': 'bg-purple-100 text-purple-800',
      'publishing': 'bg-blue-100 text-blue-800',
      'academy': 'bg-green-100 text-green-800',
      'industry': 'bg-yellow-100 text-yellow-800',
      'tips': 'bg-pink-100 text-pink-800',
      'news': 'bg-indigo-100 text-indigo-800',
    }
    
    return colors[category.toLowerCase()] || 'bg-gray-100 text-gray-800'
  }

  return (
    <>
      <BlogStructuredData post={post} url={url} />
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Button variant="ghost" asChild className="mb-4">
            <Link href="/blog">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Blog
            </Link>
          </Button>
        </div>
      </div>

      {/* Hero Section */}
      <section className="py-12 bg-white dark:bg-gray-800">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <div className="text-center">
              <div className="flex items-center justify-center gap-4 mb-6">
                {post.category && (
                  <Badge className={getCategoryColor(post.category)}>
                    {post.category}
                  </Badge>
                )}
                <div className="flex items-center text-gray-500 dark:text-gray-400">
                  <Clock className="w-4 h-4 mr-1" />
                  {estimateReadTime(post.content)} min read
                </div>
              </div>
              
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6 text-gray-900 dark:text-white">
                {post.title}
              </h1>
              
              <p className="text-xl text-gray-600 dark:text-gray-300 mb-8">
                {post.excerpt}
              </p>
              
              <div className="flex items-center justify-center gap-6 mb-8">
                <div className="flex items-center gap-3">
                  {post.author?.avatar ? (
                    <Image
                      src={post.author.avatar}
                      alt={post.author.name}
                      width={48}
                      height={48}
                      className="rounded-full"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center">
                      <User className="h-6 w-6 text-gray-600 dark:text-gray-300" />
                    </div>
                  )}
                  <div className="text-left">
                    <p className="font-medium text-gray-900 dark:text-white">
                      {post.author?.name || 'EdifyPub Team'}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {post.publishedAt && formatDistanceToNow(new Date(post.publishedAt), { addSuffix: true })}
                    </p>
                  </div>
                </div>
                
                <BlogSocialShare 
                  title={post.title}
                  excerpt={post.excerpt}
                  slug={post.slug}
                  url={`${url}/blog/${post.slug}`}
                />
              </div>
            </div>
            
            {post.coverImage && (
              <div className="relative h-64 md:h-96 rounded-lg overflow-hidden mb-8">
                <Image
                  src={post.coverImage}
                  alt={post.title}
                  fill
                  className="object-cover"
                />
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="py-12">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <Card className="mb-8">
              <CardContent className="prose prose-lg max-w-none p-8 dark:prose-invert">
                <div dangerouslySetInnerHTML={{ __html: post.content }} />
              </CardContent>
            </Card>

            {/* Tags */}
            {post.tags && post.tags.length > 0 && (
              <div className="mb-8">
                <div className="flex items-center gap-2 mb-4">
                  <Tag className="w-5 h-5 text-gray-500" />
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Tags</h3>
                </div>
                <div className="flex flex-wrap gap-2">
                  {post.tags.map((tag, index) => (
                    <Badge key={index} variant="secondary">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Author Bio */}
            <Card className="mb-12">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  {post.author?.avatar ? (
                    <Image
                      src={post.author.avatar}
                      alt={post.author.name}
                      width={64}
                      height={64}
                      className="rounded-full"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center">
                      <User className="h-8 w-8 text-gray-600 dark:text-gray-300" />
                    </div>
                  )}
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                      {post.author?.name || 'EdifyPub Team'}
                    </h4>
                    <p className="text-gray-600 dark:text-gray-300">
                      EdifyPub is a passionate publishing platform dedicated to helping writers discover their voice and share their stories with the world.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Comments Section */}
            <BlogComments postId={post.id} postSlug={post.slug} />
          </div>
        </div>
      </section>

      {/* Related Posts */}
      {relatedPosts.length > 0 && (
        <section className="py-12 bg-white dark:bg-gray-800">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-6xl mx-auto">
              <h2 className="text-2xl md:text-3xl font-bold text-center mb-8 text-gray-900 dark:text-white">
                Related Posts
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {relatedPosts.map((relatedPost) => (
                  <BlogPostCard key={relatedPost.id} post={relatedPost} />
                ))}
              </div>
            </div>
          </div>
        </section>
      )}
      </div>
    </>
  )
}
