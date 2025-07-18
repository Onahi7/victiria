'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel'
import { Calendar, Clock, User, ArrowRight, BookOpen, ChevronRight } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { formatDistance } from 'date-fns'

interface BlogPost {
  id: string
  title: string
  excerpt: string
  slug: string
  coverImage: string | null
  category: string | null
  tags: string[]
  author: {
    id: string
    name: string
    avatar: string | null
  }
  publishedAt: string
  readTime: number
}

export default function BlogSection() {
  const [blogPosts, setBlogPosts] = useState<BlogPost[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchBlogPosts()
  }, [])

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

        <div className="relative">
          <Carousel
            opts={{
              align: "start",
              loop: true,
            }}
            className="w-full"
          >
            <CarouselContent className="-ml-2 md:-ml-4">
              {blogPosts.map((post) => (
                <CarouselItem key={post.id} className="pl-2 md:pl-4 basis-full md:basis-1/2 lg:basis-1/3">
                  <Card className="group hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 border-0 shadow-lg overflow-hidden h-full">
                    <div className="relative h-48 md:h-56 overflow-hidden">
                      {post.coverImage ? (
                        <Image
                          src={post.coverImage}
                          alt={post.title}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900 dark:to-pink-900 flex items-center justify-center">
                          <BookOpen className="w-16 h-16 text-purple-400 dark:text-purple-600" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      <div className="absolute bottom-4 left-4 right-4 transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300 opacity-0 group-hover:opacity-100">
                        <Button
                          asChild
                          size="sm"
                          className="bg-white text-purple-600 hover:bg-purple-100 text-sm"
                        >
                          <Link href={`/blog/${post.slug}`}>
                            Read More
                            <ArrowRight className="ml-2 h-4 w-4" />
                          </Link>
                        </Button>
                      </div>
                    </div>
                    
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between mb-2">
                        {post.category && (
                          <Badge className={`${getCategoryColor(post.category)} text-xs`}>
                            {post.category}
                          </Badge>
                        )}
                        <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
                          <Clock className="w-3 h-3 mr-1" />
                          {post.readTime || estimateReadTime(post.excerpt || '')} min read
                        </div>
                      </div>
                      <CardTitle className="text-lg md:text-xl font-bold line-clamp-2 group-hover:text-purple-600 transition-colors duration-200">
                        <Link href={`/blog/${post.slug}`} className="hover:underline">
                          {post.title}
                        </Link>
                      </CardTitle>
                    </CardHeader>
                    
                    <CardContent className="pt-0 flex-1 flex flex-col justify-between">
                      <div>
                        <p className="text-gray-600 dark:text-gray-300 text-sm md:text-base line-clamp-3 mb-4">
                          {post.excerpt}
                        </p>
                        
                        {post.tags && post.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mb-4">
                            {post.tags.slice(0, 3).map((tag, index) => (
                              <Badge key={index} variant="secondary" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                            {post.tags.length > 3 && (
                              <Badge variant="secondary" className="text-xs">
                                +{post.tags.length - 3} more
                              </Badge>
                            )}
                          </div>
                        )}
                      </div>
                      
                      <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
                        <div className="flex items-center">
                          {post.author.avatar ? (
                            <Image
                              src={post.author.avatar}
                              alt={post.author.name}
                              width={24}
                              height={24}
                              className="rounded-full mr-2"
                            />
                          ) : (
                            <User className="w-4 h-4 mr-2" />
                          )}
                          <span>{post.author.name}</span>
                        </div>
                        <div className="flex items-center">
                          <Calendar className="w-3 h-3 mr-1" />
                          <span>{formatDistance(new Date(post.publishedAt), new Date(), { addSuffix: true })}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious className="hidden md:flex -left-12 lg:-left-16" />
            <CarouselNext className="hidden md:flex -right-12 lg:-right-16" />
          </Carousel>
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
