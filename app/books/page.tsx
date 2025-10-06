"use client"

import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ShoppingBag, Star, BookOpen, Heart, Search } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { useState, useEffect } from "react"
import { useApi } from "@/hooks/use-api"

interface Book {
  id: string
  title: string
  description: string
  price: number
  priceUsd?: number
  priceNgn?: number
  coverImage?: string // Legacy field
  frontCoverImage?: string
  backCoverImage?: string
  category: string
  status: string
  slug: string
  createdAt: string
}

export default function BooksPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
  const [scrollY, setScrollY] = useState(0)
  const [selectedCategory, setSelectedCategory] = useState("All Books")
  
  const { data: booksResponse, loading, error, get } = useApi<{ data: Book[] }>()

  // Track mouse position for parallax effects
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY })
    }

    const handleScroll = () => {
      setScrollY(window.scrollY)
    }

    window.addEventListener("mousemove", handleMouseMove)
    window.addEventListener("scroll", handleScroll)

    return () => {
      window.removeEventListener("mousemove", handleMouseMove)
      window.removeEventListener("scroll", handleScroll)
    }
  }, [])

  // Fetch books on component mount and when filters change
  useEffect(() => {
    const params = new URLSearchParams()
    params.set('status', 'published')
    
    if (selectedCategory !== "All Books") {
      params.set('category', selectedCategory)
    }
    
    if (searchTerm) {
      params.set('search', searchTerm)
    }

    get(`/api/books?${params.toString()}`)
  }, [selectedCategory, searchTerm, get])

  const categories = ["All Books", "Non-fiction", "Self-help", "Fiction"]

  const filteredBooks = booksResponse?.data || []

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Animated background elements */}
      <div className="fixed inset-0 bg-gradient-to-br from-purple-50 via-white to-pink-50 dark:from-gray-900 dark:via-purple-950/30 dark:to-gray-900 -z-10"></div>

      {/* Animated floating shapes */}
      <div
        className="fixed top-20 left-[10%] w-64 h-64 rounded-full bg-purple-300/20 dark:bg-purple-600/10 blur-3xl -z-5"
        style={{
          transform: `translate(${mousePosition.x * 0.02}px, ${mousePosition.y * 0.02}px)`,
          transition: "transform 0.5s ease-out",
        }}
      ></div>
      <div
        className="fixed top-[40%] right-[15%] w-72 h-72 rounded-full bg-pink-300/20 dark:bg-pink-600/10 blur-3xl -z-5"
        style={{
          transform: `translate(${-mousePosition.x * 0.01}px, ${-mousePosition.y * 0.01}px)`,
          transition: "transform 0.7s ease-out",
        }}
      ></div>
      <div
        className="fixed bottom-[10%] left-[20%] w-80 h-80 rounded-full bg-purple-400/10 dark:bg-purple-700/10 blur-3xl -z-5"
        style={{
          transform: `translate(${mousePosition.y * 0.01}px, ${-mousePosition.x * 0.01}px)`,
          transition: "transform 0.6s ease-out",
        }}
      ></div>

      {/* Animated gradient border */}
      <div className="fixed inset-0 pointer-events-none -z-5">
        <div
          className="absolute inset-0 opacity-20 dark:opacity-30"
          style={{
            background: `radial-gradient(circle at ${mousePosition.x}px ${mousePosition.y}px, rgba(168, 85, 247, 0.4), transparent 40%)`,
            transition: "all 0.3s ease-out",
          }}
        ></div>
      </div>

      <header className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-md sticky top-0 z-10 shadow-md">
        <div className="container py-6 px-4 sm:px-6">
          <h1
            className="text-3xl sm:text-4xl md:text-5xl font-bold text-center bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-pink-600 mb-4"
            style={{
              transform: `translateY(${scrollY * 0.1}px)`,
              transition: "transform 0.1s ease-out",
            }}
          >
            EdifyPub Books
          </h1>
          <p className="text-center mt-2 text-gray-600 dark:text-gray-300 max-w-2xl mx-auto mb-6">
            Discover inspiring stories and transformative journeys through our collection of books.
          </p>
          <div className="relative max-w-md mx-auto">
            <Input
              type="text"
              placeholder="Search books..."
              className="pl-10 pr-4 py-2 w-full rounded-full border-purple-300 focus:border-purple-500 focus:ring focus:ring-purple-200 focus:ring-opacity-50 shadow-md"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          </div>
        </div>
      </header>

      <main className="container py-12 px-4 sm:px-6 relative z-10">
        <Tabs value={selectedCategory} onValueChange={setSelectedCategory} className="mb-12">
          <TabsList className="flex flex-wrap justify-center gap-2 mb-8 px-2">
            {categories.map((category) => (
              <TabsTrigger
                key={category}
                value={category}
                className="px-4 py-2 rounded-full transition-all duration-300 data-[state=active]:bg-purple-600 data-[state=active]:text-white data-[state=active]:shadow-lg"
              >
                {category}
              </TabsTrigger>
            ))}
          </TabsList>
          
          {categories.map((category) => (
            <TabsContent key={category} value={category}>
              {loading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
                  {[...Array(6)].map((_, index) => (
                    <Card key={index} className="overflow-hidden animate-pulse">
                      <div className="h-[400px] bg-muted"></div>
                      <CardHeader>
                        <div className="h-6 bg-muted rounded"></div>
                        <div className="h-4 bg-muted rounded w-3/4"></div>
                      </CardHeader>
                      <CardContent>
                        <div className="h-4 bg-muted rounded w-1/2 mb-4"></div>
                        <div className="h-10 bg-muted rounded"></div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : error ? (
                <div className="flex flex-col items-center justify-center py-20">
                  <p className="text-xl text-red-500 mb-4">Error loading books</p>
                  <p className="text-muted-foreground mb-4">{error}</p>
                  <Button onClick={() => get('/api/books?status=published')}>
                    Retry
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
                  {filteredBooks.map((book) => (
                    <Card
                      key={book.id}
                      className="group overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-500 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-2xl transform hover:-translate-y-2 border border-purple-100 dark:border-purple-900"
                    >
                      <div className="relative h-[300px] sm:h-[350px] md:h-[400px] overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent z-10"></div>
                        <Image
                          src={book.frontCoverImage || book.coverImage || "/placeholder.svg"}
                          alt={`${book.title} book cover`}
                          fill
                          className="object-cover transition-transform duration-700 group-hover:scale-110"
                          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        />
                        <div className="absolute top-3 right-3 z-20">
                          <Badge className="bg-purple-600/90 backdrop-blur-sm text-white px-3 py-1 rounded-full text-sm font-semibold shadow-lg">
                            {book.status === 'published' ? 'Available' : 'Coming Soon'}
                          </Badge>
                        </div>
                      </div>
                      <CardHeader>
                        <CardTitle className="text-xl sm:text-2xl font-semibold text-purple-600 dark:text-purple-400">
                          {book.title}
                        </CardTitle>
                        <CardDescription className="text-gray-600 dark:text-gray-300">
                          {book.description}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                className="w-4 sm:w-5 h-4 sm:h-5 text-yellow-400 fill-yellow-400"
                              />
                            ))}
                            <span className="ml-2 text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                              5.0/5
                            </span>
                          </div>
                          <span className="font-bold text-base sm:text-lg text-purple-600 dark:text-purple-400">
                            {book.priceNgn && book.priceUsd ? (
                              <>
                                <span className="text-sm">₦{Number(book.priceNgn).toLocaleString()}</span>
                                <span className="text-muted-foreground mx-1">|</span>
                                <span className="text-sm">${Number(book.priceUsd).toLocaleString()}</span>
                              </>
                            ) : book.priceNgn ? (
                              `₦${Number(book.priceNgn).toLocaleString()}`
                            ) : book.priceUsd ? (
                              `$${Number(book.priceUsd).toLocaleString()}`
                            ) : (
                              `₦${book.price.toLocaleString()}`
                            )}
                          </span>
                        </div>
                        <div className="flex flex-col sm:flex-row gap-2 sm:space-x-2">
                          <Button className="w-full sm:flex-1 bg-purple-600 text-white hover:bg-purple-700 dark:bg-purple-700 dark:hover:bg-purple-600 transition-colors duration-200">
                            Buy Now
                            <ShoppingBag className="ml-2 h-4 w-4" />
                          </Button>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              className="flex-1 border-purple-600 text-purple-600 hover:bg-purple-100 dark:border-purple-400 dark:text-purple-400 dark:hover:bg-purple-900 transition-colors duration-200"
                            >
                              <BookOpen className="h-4 w-4" />
                              <span className="ml-2 hidden sm:inline">Preview</span>
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-purple-600 hover:bg-purple-100 dark:text-purple-400 dark:hover:bg-purple-900 transition-colors duration-200"
                            >
                              <Heart className="h-5 w-5" />
                              <span className="sr-only">Add to wishlist</span>
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
              
              {!loading && !error && filteredBooks.length === 0 && (
                <div className="flex flex-col items-center justify-center py-20">
                  <p className="text-xl text-gray-500 dark:text-gray-400 mb-4">No books found</p>
                  <Button
                    variant="outline"
                    onClick={() => setSearchTerm("")}
                    className="border-purple-600 text-purple-600 hover:bg-purple-100 dark:border-purple-400 dark:text-purple-400"
                  >
                    Clear search
                  </Button>
                </div>
              )}
            </TabsContent>
          ))}
        </Tabs>
      </main>
    </div>
  )
}

