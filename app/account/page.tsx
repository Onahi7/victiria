import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { BookOpen, Download, Star, Clock, TrendingUp, Users, Calendar, Heart } from "lucide-react"
import Link from "next/link"

export default function AccountPage() {
  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Mobile Header */}
      <div className="text-center sm:text-left">
        <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight">My Account</h1>
        <p className="text-xs sm:text-sm lg:text-base text-muted-foreground mt-1">
          Manage your orders, downloads, and account settings
        </p>
      </div>

      {/* Quick Stats - Mobile Optimized */}
      <div className="grid gap-2 sm:gap-3 lg:gap-4 grid-cols-2 lg:grid-cols-4">
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">Orders</CardTitle>
            <BookOpen className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground flex-shrink-0" />
          </CardHeader>
          <CardContent>
            <div className="text-base sm:text-lg lg:text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">Total orders</p>
          </CardContent>
        </Card>
        
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">Books</CardTitle>
            <Download className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground flex-shrink-0" />
          </CardHeader>
          <CardContent>
            <div className="text-base sm:text-lg lg:text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">In library</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">Courses</CardTitle>
            <Star className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground flex-shrink-0" />
          </CardHeader>
          <CardContent>
            <div className="text-base sm:text-lg lg:text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">Enrolled</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">Progress</CardTitle>
            <Clock className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground flex-shrink-0" />
          </CardHeader>
          <CardContent>
            <div className="text-base sm:text-lg lg:text-2xl font-bold">0%</div>
            <p className="text-xs text-muted-foreground">Reading</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions - Mobile First */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm sm:text-base lg:text-lg">Quick Actions</CardTitle>
          <CardDescription className="text-xs sm:text-sm">
            Get started with your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-2 sm:gap-3 grid-cols-2 lg:grid-cols-4">
            <Button variant="outline" className="text-xs sm:text-sm h-auto py-3 flex-col gap-1" asChild>
              <Link href="/books">
                <BookOpen className="h-4 w-4 sm:h-5 sm:w-5" />
                <span>Browse Books</span>
              </Link>
            </Button>
            <Button variant="outline" className="text-xs sm:text-sm h-auto py-3 flex-col gap-1" asChild>
              <Link href="/academy">
                <Star className="h-4 w-4 sm:h-5 sm:w-5" />
                <span>Academy</span>
              </Link>
            </Button>
            <Button variant="outline" className="text-xs sm:text-sm h-auto py-3 flex-col gap-1" asChild>
              <Link href="/account/wishlist">
                <Heart className="h-4 w-4 sm:h-5 sm:w-5" />
                <span>Wishlist</span>
              </Link>
            </Button>
            <Button variant="outline" className="text-xs sm:text-sm h-auto py-3 flex-col gap-1" asChild>
              <Link href="/account/events">
                <Calendar className="h-4 w-4 sm:h-5 sm:w-5" />
                <span>Events</span>
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity - Mobile Optimized */}
      <div className="grid gap-3 sm:gap-4 lg:gap-6 grid-cols-1 lg:grid-cols-2">
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="text-sm sm:text-base lg:text-lg">Recent Orders</CardTitle>
            <CardDescription className="text-xs sm:text-sm">Your latest purchases</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-6 sm:py-8 text-muted-foreground">
              <BookOpen className="h-8 w-8 sm:h-10 sm:w-10 lg:h-12 lg:w-12 mx-auto mb-2 opacity-50" />
              <p className="text-xs sm:text-sm lg:text-base mb-2">No recent orders</p>
              <p className="text-xs sm:text-sm text-muted-foreground mb-3">
                Start shopping to see your orders here
              </p>
              <Button variant="outline" size="sm" className="text-xs sm:text-sm" asChild>
                <Link href="/books">
                  Browse Books
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="text-sm sm:text-base lg:text-lg">Course Progress</CardTitle>
            <CardDescription className="text-xs sm:text-sm">Continue learning</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-6 sm:py-8 text-muted-foreground">
              <Star className="h-8 w-8 sm:h-10 sm:w-10 lg:h-12 lg:w-12 mx-auto mb-2 opacity-50" />
              <p className="text-xs sm:text-sm lg:text-base mb-2">No courses enrolled</p>
              <p className="text-xs sm:text-sm text-muted-foreground mb-3">
                Explore our academy to start learning
              </p>
              <Button variant="outline" size="sm" className="text-xs sm:text-sm" asChild>
                <Link href="/academy">
                  Explore Academy
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Activity Feed - Mobile Optimized */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm sm:text-base lg:text-lg">Recent Activity</CardTitle>
          <CardDescription className="text-xs sm:text-sm">
            Your latest account activity
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center gap-3 p-2 rounded-lg bg-muted/50">
              <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                <Users className="h-4 w-4 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs sm:text-sm font-medium">Welcome to EdifyPub!</p>
                <p className="text-xs text-muted-foreground">Account created successfully</p>
              </div>
              <Badge variant="secondary" className="text-xs">New</Badge>
            </div>
            
            <div className="text-center py-4 text-muted-foreground">
              <TrendingUp className="h-6 w-6 sm:h-8 sm:w-8 mx-auto mb-2 opacity-50" />
              <p className="text-xs sm:text-sm">More activity will appear here as you use the platform</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
