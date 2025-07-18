import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { BookOpen, Clock, Play, Trophy, Star } from "lucide-react"
import Link from "next/link"

export default function AccountCoursesPage() {
  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="text-center sm:text-left">
        <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight">My Courses</h1>
        <p className="text-xs sm:text-sm lg:text-base text-muted-foreground mt-1 sm:mt-2">
          Track your progress in DIFY Academy courses
        </p>
      </div>

      {/* Course Stats */}
      <div className="grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-4">
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">Enrolled Courses</CardTitle>
            <BookOpen className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground flex-shrink-0" />
          </CardHeader>
          <CardContent>
            <div className="text-lg sm:text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">Total enrollments</p>
          </CardContent>
        </Card>
        
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">Completed</CardTitle>
            <Trophy className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground flex-shrink-0" />
          </CardHeader>
          <CardContent>
            <div className="text-lg sm:text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">Courses finished</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">In Progress</CardTitle>
            <Play className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground flex-shrink-0" />
          </CardHeader>
          <CardContent>
            <div className="text-lg sm:text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">Active courses</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">Study Time</CardTitle>
            <Clock className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground flex-shrink-0" />
          </CardHeader>
          <CardContent>
            <div className="text-lg sm:text-2xl font-bold">0h</div>
            <p className="text-xs text-muted-foreground">Total hours</p>
          </CardContent>
        </Card>
      </div>

      {/* Current Courses */}
      <div className="grid gap-4 sm:gap-6 md:grid-cols-2">
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="text-lg sm:text-xl">Current Courses</CardTitle>
            <CardDescription className="text-sm">Continue your learning journey</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-4 sm:py-6 text-muted-foreground">
              <BookOpen className="h-8 w-8 sm:h-12 sm:w-12 mx-auto mb-2 opacity-50" />
              <p className="text-sm sm:text-base">No courses enrolled</p>
              <p className="text-xs sm:text-sm mt-1">Browse the academy to get started</p>
              <Button className="mt-3 sm:mt-4 text-sm sm:text-base" asChild>
                <Link href="/academy">
                  Browse Courses
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="text-lg sm:text-xl">Completed Courses</CardTitle>
            <CardDescription className="text-sm">Your achievements and certificates</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-4 sm:py-6 text-muted-foreground">
              <Trophy className="h-8 w-8 sm:h-12 sm:w-12 mx-auto mb-2 opacity-50" />
              <p className="text-sm sm:text-base">No completed courses</p>
              <p className="text-xs sm:text-sm mt-1">Complete courses to earn certificates</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Course Recommendations */}
      <Card className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20">
        <CardHeader>
          <CardTitle className="text-lg sm:text-xl">Recommended for You</CardTitle>
          <CardDescription className="text-sm sm:text-base">
            Popular courses that match your interests
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-start gap-4 p-3 sm:p-4 border rounded-lg bg-white dark:bg-gray-900">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center flex-shrink-0">
                <BookOpen className="h-6 w-6 sm:h-8 sm:w-8 text-purple-600 dark:text-purple-400" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-medium text-sm sm:text-base">Writing Fundamentals</h4>
                <p className="text-xs sm:text-sm text-muted-foreground mb-2">
                  Master the basics of creative writing
                </p>
                <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
                  <Clock className="h-3 w-3 sm:h-4 sm:w-4" />
                  <span>6 hours</span>
                  <Badge variant="secondary" className="text-xs">Beginner</Badge>
                </div>
              </div>
              <Button size="sm" className="text-xs sm:text-sm">
                Enroll
              </Button>
            </div>

            <div className="flex items-start gap-4 p-3 sm:p-4 border rounded-lg bg-white dark:bg-gray-900">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center flex-shrink-0">
                <BookOpen className="h-6 w-6 sm:h-8 sm:w-8 text-purple-600 dark:text-purple-400" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-medium text-sm sm:text-base">Character Development</h4>
                <p className="text-xs sm:text-sm text-muted-foreground mb-2">
                  Create compelling and memorable characters
                </p>
                <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
                  <Clock className="h-3 w-3 sm:h-4 sm:w-4" />
                  <span>4 hours</span>
                  <Badge variant="secondary" className="text-xs">Intermediate</Badge>
                </div>
              </div>
              <Button size="sm" className="text-xs sm:text-sm">
                Enroll
              </Button>
            </div>

            <div className="flex items-start gap-4 p-3 sm:p-4 border rounded-lg bg-white dark:bg-gray-900">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center flex-shrink-0">
                <BookOpen className="h-6 w-6 sm:h-8 sm:w-8 text-purple-600 dark:text-purple-400" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-medium text-sm sm:text-base">Publishing Success</h4>
                <p className="text-xs sm:text-sm text-muted-foreground mb-2">
                  Navigate the publishing world with confidence
                </p>
                <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
                  <Clock className="h-3 w-3 sm:h-4 sm:w-4" />
                  <span>8 hours</span>
                  <Badge variant="secondary" className="text-xs">Advanced</Badge>
                </div>
              </div>
              <Button size="sm" className="text-xs sm:text-sm">
                Enroll
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
