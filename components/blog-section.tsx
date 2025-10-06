'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import { PostCard } from './post-card'

interface BlogPost {
  id: string
  title: string
  excerpt: string
  slug: string
  coverImage: string | null
  category: string | null
  author: {
    name: string
    avatar: string | null
  }
  publishedAt: string
}

export default function BlogSection() {
  const [blogPosts, setBlogPosts] = useState<BlogPost[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchBlogPosts = async () => {
      try {
        const response = await fetch('/api/blog?status=published&limit=6')
        if (!response.ok) throw new Error('Failed to fetch blog posts')
        
        const data = await response.json()
        if (data.success) {
          setBlogPosts(data.data || [])
        }
      } catch (error) {
        console.error('Error fetching blog posts:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchBlogPosts()
  }, [])

  if (loading) {
    return (
      <section className="py-12 md:py-16 lg:py-20 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-gray-900 dark:to-gray-800">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-pink-600">
              Latest from the Blog
            </h2>
            <p className="text-lg md:text-xl text-gray-600 dark:text-gray-300">
              Loading latest insights and stories...
            </p>
          </div>
        </div>
      </section>
    )
  }

  if (!blogPosts || blogPosts.length === 0) {
    return (
      <section className="py-12 md:py-16 lg:py-20 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-gray-900 dark:to-gray-800">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-pink-600">
              Latest from the Blog
            </h2>
            <p className="text-lg md:text-xl text-gray-600 dark:text-gray-300">
              No blog posts available at the moment. Check back soon for fresh insights!
            </p>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="py-12 md:py-16 lg:py-20 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-pink-600">
            Latest from the Blog
          </h2>
          <p className="text-lg md:text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
            Discover insights, tips, and stories from the world of writing and publishing
          </p>
        </div>

        {/* Mobile: Horizontal Scroll */}
        <div className="md:hidden">
          <div className="flex overflow-x-auto space-x-4 pb-4 -mx-4 px-4">
            {blogPosts.map((post) => (
              <div key={post.id} className="flex-shrink-0 w-4/5">
                <PostCard post={post} />
              </div>
            ))}
          </div>
        </div>

        {/* Desktop: Grid */}
        <div className="hidden md:grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          {blogPosts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>

        <div className="text-center mt-12">
          <Button
            asChild
            size="lg"
            className="bg-purple-600 text-white hover:bg-purple-700 dark:bg-purple-700 dark:hover:bg-purple-600"
          >
            <Link href="/blog" className="flex items-center">
              View All Posts
              <ChevronRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  )
}
