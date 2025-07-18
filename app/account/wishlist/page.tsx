import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Heart, ShoppingCart, Star, Trash2, Share2 } from "lucide-react"
import Link from "next/link"

export default function AccountWishlistPage() {
  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="text-center sm:text-left">
        <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight">My Wishlist</h1>
        <p className="text-xs sm:text-sm lg:text-base text-muted-foreground mt-1 sm:mt-2">
          Books and courses you've saved for later
        </p>
      </div>

      {/* Wishlist Stats */}
      <div className="grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-3">
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">Saved Books</CardTitle>
            <Heart className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground flex-shrink-0" />
          </CardHeader>
          <CardContent>
            <div className="text-lg sm:text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">Books in wishlist</p>
          </CardContent>
        </Card>
        
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">Saved Courses</CardTitle>
            <Heart className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground flex-shrink-0" />
          </CardHeader>
          <CardContent>
            <div className="text-lg sm:text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">Courses saved</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">Total Value</CardTitle>
            <ShoppingCart className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground flex-shrink-0" />
          </CardHeader>
          <CardContent>
            <div className="text-lg sm:text-2xl font-bold">$0</div>
            <p className="text-xs text-muted-foreground">Combined value</p>
          </CardContent>
        </Card>
      </div>

      {/* Wishlist Sections */}
      <div className="grid gap-4 sm:gap-6 md:grid-cols-2">
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="text-lg sm:text-xl">Saved Books</CardTitle>
            <CardDescription className="text-sm">Your book wishlist</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-4 sm:py-6 text-muted-foreground">
              <Heart className="h-8 w-8 sm:h-12 sm:w-12 mx-auto mb-2 opacity-50" />
              <p className="text-sm sm:text-base">No books saved yet</p>
              <p className="text-xs sm:text-sm mt-1">Save books to your wishlist while browsing</p>
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
            <CardTitle className="text-lg sm:text-xl">Saved Courses</CardTitle>
            <CardDescription className="text-sm">Your course wishlist</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-4 sm:py-6 text-muted-foreground">
              <Heart className="h-8 w-8 sm:h-12 sm:w-12 mx-auto mb-2 opacity-50" />
              <p className="text-sm sm:text-base">No courses saved yet</p>
              <p className="text-xs sm:text-sm mt-1">Save courses to your wishlist while browsing</p>
              <Button className="mt-3 sm:mt-4 text-sm sm:text-base" asChild>
                <Link href="/academy">
                  Browse Courses
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recently Viewed */}
      <Card className="bg-gradient-to-r from-rose-50 to-orange-50 dark:from-rose-900/20 dark:to-orange-900/20">
        <CardHeader>
          <CardTitle className="text-lg sm:text-xl">Recently Viewed</CardTitle>
          <CardDescription className="text-sm sm:text-base">
            Items you've viewed recently
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-start gap-4 p-3 sm:p-4 border rounded-lg bg-white dark:bg-gray-900">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-rose-100 dark:bg-rose-900 rounded-lg flex items-center justify-center flex-shrink-0">
                <span className="text-xs sm:text-sm font-medium text-rose-600 dark:text-rose-400">B</span>
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-medium text-sm sm:text-base">The Writer's Journey</h4>
                <p className="text-xs sm:text-sm text-muted-foreground mb-2">
                  By Sarah Mitchell
                </p>
                <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
                  <Star className="h-3 w-3 sm:h-4 sm:w-4 fill-current text-yellow-400" />
                  <span>4.5</span>
                  <Badge variant="secondary" className="text-xs">Fiction</Badge>
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <Button size="sm" variant="outline" className="text-xs sm:text-sm">
                  <Heart className="h-3 w-3 sm:h-4 sm:w-4" />
                </Button>
                <Button size="sm" className="text-xs sm:text-sm">
                  <ShoppingCart className="h-3 w-3 sm:h-4 sm:w-4" />
                </Button>
              </div>
            </div>

            <div className="flex items-start gap-4 p-3 sm:p-4 border rounded-lg bg-white dark:bg-gray-900">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-rose-100 dark:bg-rose-900 rounded-lg flex items-center justify-center flex-shrink-0">
                <span className="text-xs sm:text-sm font-medium text-rose-600 dark:text-rose-400">C</span>
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-medium text-sm sm:text-base">Creative Writing Masterclass</h4>
                <p className="text-xs sm:text-sm text-muted-foreground mb-2">
                  By Michael Thompson
                </p>
                <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
                  <Star className="h-3 w-3 sm:h-4 sm:w-4 fill-current text-yellow-400" />
                  <span>4.8</span>
                  <Badge variant="secondary" className="text-xs">Course</Badge>
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <Button size="sm" variant="outline" className="text-xs sm:text-sm">
                  <Heart className="h-3 w-3 sm:h-4 sm:w-4" />
                </Button>
                <Button size="sm" className="text-xs sm:text-sm">
                  <ShoppingCart className="h-3 w-3 sm:h-4 sm:w-4" />
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Wishlist Management */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg sm:text-xl">Wishlist Management</CardTitle>
          <CardDescription className="text-sm sm:text-base">
            Manage your saved items
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-4">
            <Button variant="outline" className="text-xs sm:text-sm">
              <Share2 className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
              Share Wishlist
            </Button>
            <Button variant="outline" className="text-xs sm:text-sm">
              <Heart className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
              Export List
            </Button>
            <Button variant="outline" className="text-xs sm:text-sm">
              <ShoppingCart className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
              Buy All
            </Button>
            <Button variant="outline" className="text-xs sm:text-sm">
              <Trash2 className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
              Clear All
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
