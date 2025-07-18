import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Calendar, Clock, MapPin, Users, BookOpen, Video, Star } from "lucide-react"
import Link from "next/link"

export default function AccountEventsPage() {
  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="text-center sm:text-left">
        <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight">My Events</h1>
        <p className="text-xs sm:text-sm lg:text-base text-muted-foreground mt-1 sm:mt-2">
          Manage your registered events and workshops
        </p>
      </div>

      {/* Event Stats */}
      <div className="grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-4">
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">Upcoming Events</CardTitle>
            <Calendar className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground flex-shrink-0" />
          </CardHeader>
          <CardContent>
            <div className="text-lg sm:text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">Events registered</p>
          </CardContent>
        </Card>
        
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">Past Events</CardTitle>
            <BookOpen className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground flex-shrink-0" />
          </CardHeader>
          <CardContent>
            <div className="text-lg sm:text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">Events attended</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">Workshops</CardTitle>
            <Video className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground flex-shrink-0" />
          </CardHeader>
          <CardContent>
            <div className="text-lg sm:text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">Workshops joined</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">Certificates</CardTitle>
            <Star className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground flex-shrink-0" />
          </CardHeader>
          <CardContent>
            <div className="text-lg sm:text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">Certificates earned</p>
          </CardContent>
        </Card>
      </div>

      {/* Event Categories */}
      <div className="grid gap-4 sm:gap-6 md:grid-cols-2">
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="text-lg sm:text-xl">Upcoming Events</CardTitle>
            <CardDescription className="text-sm">Your registered events</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-4 sm:py-6 text-muted-foreground">
              <Calendar className="h-8 w-8 sm:h-12 sm:w-12 mx-auto mb-2 opacity-50" />
              <p className="text-sm sm:text-base">No upcoming events</p>
              <p className="text-xs sm:text-sm mt-1">Register for events to see them here</p>
              <Button className="mt-3 sm:mt-4 text-sm sm:text-base" asChild>
                <Link href="/events">
                  Browse Events
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="text-lg sm:text-xl">Past Events</CardTitle>
            <CardDescription className="text-sm">Your event history</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-4 sm:py-6 text-muted-foreground">
              <BookOpen className="h-8 w-8 sm:h-12 sm:w-12 mx-auto mb-2 opacity-50" />
              <p className="text-sm sm:text-base">No past events</p>
              <p className="text-xs sm:text-sm mt-1">Attend events to build your history</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Featured Events */}
      <Card className="bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20">
        <CardHeader>
          <CardTitle className="text-lg sm:text-xl">Featured Events</CardTitle>
          <CardDescription className="text-sm sm:text-base">
            Don't miss these upcoming events
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-start gap-4 p-3 sm:p-4 border rounded-lg bg-white dark:bg-gray-900">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center flex-shrink-0">
                <Calendar className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-medium text-sm sm:text-base">Writer's Workshop: Character Development</h4>
                <p className="text-xs sm:text-sm text-muted-foreground mb-2">
                  Learn to create compelling characters that readers will love
                </p>
                <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3 sm:h-4 sm:w-4" />
                    <span>Dec 15, 2024</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3 sm:h-4 sm:w-4" />
                    <span>2:00 PM</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <MapPin className="h-3 w-3 sm:h-4 sm:w-4" />
                    <span>Online</span>
                  </div>
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <Badge variant="secondary" className="text-xs">Workshop</Badge>
                <Button size="sm" className="text-xs sm:text-sm">
                  Register
                </Button>
              </div>
            </div>

            <div className="flex items-start gap-4 p-3 sm:p-4 border rounded-lg bg-white dark:bg-gray-900">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center flex-shrink-0">
                <Video className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-medium text-sm sm:text-base">Webinar: Publishing in the Digital Age</h4>
                <p className="text-xs sm:text-sm text-muted-foreground mb-2">
                  Expert panel on modern publishing strategies
                </p>
                <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3 sm:h-4 sm:w-4" />
                    <span>Dec 20, 2024</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3 sm:h-4 sm:w-4" />
                    <span>7:00 PM</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Users className="h-3 w-3 sm:h-4 sm:w-4" />
                    <span>100+ attending</span>
                  </div>
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <Badge variant="secondary" className="text-xs">Webinar</Badge>
                <Button size="sm" className="text-xs sm:text-sm">
                  Register
                </Button>
              </div>
            </div>

            <div className="flex items-start gap-4 p-3 sm:p-4 border rounded-lg bg-white dark:bg-gray-900">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center flex-shrink-0">
                <BookOpen className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-medium text-sm sm:text-base">Book Club: Monthly Discussion</h4>
                <p className="text-xs sm:text-sm text-muted-foreground mb-2">
                  Join our monthly book discussion group
                </p>
                <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3 sm:h-4 sm:w-4" />
                    <span>Dec 25, 2024</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3 sm:h-4 sm:w-4" />
                    <span>6:00 PM</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <MapPin className="h-3 w-3 sm:h-4 sm:w-4" />
                    <span>Community Center</span>
                  </div>
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <Badge variant="secondary" className="text-xs">Book Club</Badge>
                <Button size="sm" className="text-xs sm:text-sm">
                  Join
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Event Preferences */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg sm:text-xl">Event Preferences</CardTitle>
          <CardDescription className="text-sm sm:text-base">
            Customize your event experience
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-4">
            <Button variant="outline" className="text-xs sm:text-sm">
              <Calendar className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
              Notifications
            </Button>
            <Button variant="outline" className="text-xs sm:text-sm">
              <MapPin className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
              Location
            </Button>
            <Button variant="outline" className="text-xs sm:text-sm">
              <Users className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
              Interests
            </Button>
            <Button variant="outline" className="text-xs sm:text-sm">
              <Star className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
              Certificates
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
