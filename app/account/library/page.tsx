import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import { BookOpen, Search, Filter, Star, Clock, Download, Eye } from "lucide-react"
import Link from "next/link"

export default function LibraryPage() {
  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="text-center sm:text-left">
        <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight">My Library</h1>
        <p className="text-xs sm:text-sm lg:text-base text-muted-foreground mt-1 sm:mt-2">
          Access your purchased books and reading progress
        </p>
      </div>

      {/* Library Stats */}
      <div className="grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-4">
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">Total Books</CardTitle>
            <BookOpen className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground flex-shrink-0" />
          </CardHeader>
          <CardContent>
            <div className="text-lg sm:text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">Books owned</p>
          </CardContent>
        </Card>
        
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">Currently Reading</CardTitle>
            <Eye className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground flex-shrink-0" />
          </CardHeader>
          <CardContent>
            <div className="text-lg sm:text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">Books in progress</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">Completed</CardTitle>
            <Star className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground flex-shrink-0" />
          </CardHeader>
          <CardContent>
            <div className="text-lg sm:text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">Books finished</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">Reading Time</CardTitle>
            <Clock className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground flex-shrink-0" />
          </CardHeader>
          <CardContent>
            <div className="text-lg sm:text-2xl font-bold">0h</div>
            <p className="text-xs text-muted-foreground">Total hours</p>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filter */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg sm:text-xl">Search Library</CardTitle>
          <CardDescription className="text-sm">Find books in your collection</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Search your library..." 
                className="pl-10 text-sm sm:text-base"
              />
            </div>
            <Button variant="outline" className="text-sm sm:text-base">
              <Filter className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
              Filter
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Library Sections */}
      <div className="grid gap-4 sm:gap-6 md:grid-cols-2">
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="text-lg sm:text-xl">Currently Reading</CardTitle>
            <CardDescription className="text-sm">Continue where you left off</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-4 sm:py-6 text-muted-foreground">
              <Eye className="h-8 w-8 sm:h-12 sm:w-12 mx-auto mb-2 opacity-50" />
              <p className="text-sm sm:text-base">No books in progress</p>
              <p className="text-xs sm:text-sm mt-1">Start reading a book to see it here</p>
              <Button className="mt-3 sm:mt-4 text-sm sm:text-base" asChild>
                <Link href="/books">
                  Browse Books
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="text-lg sm:text-xl">Recent Purchases</CardTitle>
            <CardDescription className="text-sm">Your latest book acquisitions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-4 sm:py-6 text-muted-foreground">
              <BookOpen className="h-8 w-8 sm:h-12 sm:w-12 mx-auto mb-2 opacity-50" />
              <p className="text-sm sm:text-base">No recent purchases</p>
              <p className="text-xs sm:text-sm mt-1">Purchase books to build your library</p>
              <Button className="mt-3 sm:mt-4 text-sm sm:text-base" asChild>
                <Link href="/books">
                  Shop Books
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Library Management */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg sm:text-xl">Library Management</CardTitle>
          <CardDescription className="text-sm sm:text-base">
            Organize and manage your book collection
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-4">
            <Button variant="outline" className="text-xs sm:text-sm">
              <Download className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
              Download All
            </Button>
            <Button variant="outline" className="text-xs sm:text-sm">
              <Star className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
              Mark Favorites
            </Button>
            <Button variant="outline" className="text-xs sm:text-sm">
              <BookOpen className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
              Create Collections
            </Button>
            <Button variant="outline" className="text-xs sm:text-sm">
              <Clock className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
              Reading Stats
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
