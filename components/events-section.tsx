'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { CalendarDays, Clock, MapPin, Users, Globe, DollarSign, PlayCircle } from 'lucide-react'
import { useSession } from 'next-auth/react'
import { toast } from '@/hooks/use-toast'

interface Event {
  id: string
  title: string
  description: string
  shortDescription: string
  type: 'workshop' | 'webinar' | 'book_launch' | 'masterclass' | 'meet_greet' | 'conference'
  startDate: string
  endDate: string
  location: string | null
  isOnline: boolean
  meetingLink: string | null
  price: string
  isFree: boolean
  maxAttendees: number | null
  requirements: string | null
  agenda: string | null
  bannerImage: string | null
  isPublished: boolean
  status: 'draft' | 'published' | 'cancelled' | 'completed'
  registrationDeadline: string | null
  registrationCount: number
}

interface Registration {
  id: string
  status: 'registered' | 'attended' | 'cancelled' | 'no_show'
  paymentStatus: 'pending' | 'completed'
  paymentReference: string | null
  amountPaid: number | null
  registeredAt: string
}

export default function EventsSection() {
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [registrations, setRegistrations] = useState<Record<string, Registration>>({})
  const [registering, setRegistering] = useState<string | null>(null)
  const { data: session } = useSession()

  useEffect(() => {
    fetchEvents()
  }, [])

  useEffect(() => {
    if (session && events && events.length > 0) {
      fetchRegistrations()
    }
  }, [session, events])

  const fetchEvents = async () => {
    try {
      const response = await fetch('/api/events?status=published&limit=6')
      if (!response.ok) throw new Error('Failed to fetch events')
      
      const data = await response.json()
      if (data.success) {
        setEvents(data.data || [])
      }
    } catch (error) {
      console.error('Error fetching events:', error)
      setEvents([]) // Ensure events is always an array
      toast({
        title: "Error",
        description: "Failed to load events",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchRegistrations = async () => {
    try {
      if (!events || events.length === 0) return
      
      const promises = events.map(async (event) => {
        const response = await fetch(`/api/events/${event.id}/register`)
        if (response.ok) {
          const data = await response.json()
          return { eventId: event.id, registration: data.data.registration }
        }
        return { eventId: event.id, registration: null }
      })

      const results = await Promise.all(promises)
      const registrationMap: Record<string, Registration> = {}
      
      results.forEach(({ eventId, registration }) => {
        if (registration) {
          registrationMap[eventId] = registration
        }
      })

      setRegistrations(registrationMap)
    } catch (error) {
      console.error('Error fetching registrations:', error)
    }
  }

  const handleRegister = async (eventId: string) => {
    if (!session) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to register for events",
        variant: "destructive"
      })
      return
    }

    setRegistering(eventId)

    try {
      const response = await fetch(`/api/events/${eventId}/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          paymentMethod: 'paystack'
        })
      })

      const data = await response.json()

      if (data.success) {
        toast({
          title: "Registration Successful!",
          description: data.message,
        })
        
        // Refresh registrations
        fetchRegistrations()
        
        // If payment is required, you would redirect to payment here
        if (data.data.paymentRequired) {
          // Implement payment flow
          console.log('Payment required:', data.data.paymentReference)
        }
      } else {
        toast({
          title: "Registration Failed",
          description: data.error,
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error('Error registering:', error)
      toast({
        title: "Error",
        description: "Failed to register for event",
        variant: "destructive"
      })
    } finally {
      setRegistering(null)
    }
  }

  const getEventTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      workshop: 'Workshop',
      webinar: 'Webinar',
      book_launch: 'Book Launch',
      masterclass: 'Masterclass',
      meet_greet: 'Meet & Greet',
      conference: 'Conference'
    }
    return labels[type] || type
  }

  const getEventTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      workshop: 'bg-blue-500',
      webinar: 'bg-green-500',
      book_launch: 'bg-purple-500',
      masterclass: 'bg-orange-500',
      meet_greet: 'bg-pink-500',
      conference: 'bg-indigo-500'
    }
    return colors[type] || 'bg-gray-500'
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const isRegistrationOpen = (event: Event) => {
    const now = new Date()
    const startDate = new Date(event.startDate)
    const registrationDeadline = event.registrationDeadline 
      ? new Date(event.registrationDeadline) 
      : startDate

    return now < registrationDeadline && now < startDate && event.status === 'published'
  }

  const isEventFull = (event: Event) => {
    return event.maxAttendees && event.registrationCount >= event.maxAttendees
  }

  if (loading) {
    return (
      <section className="py-24 bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Upcoming Events
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
              Loading events...
            </p>
          </div>
        </div>
      </section>
    )
  }

  if (!events || events.length === 0) {
    return (
      <section className="py-24 bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Upcoming Events
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
              No upcoming events at the moment. Check back soon for exciting events with EdifyPub!
            </p>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="py-24 bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Upcoming Events
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
            Join EdifyPub for exclusive events, workshops, and literary experiences. 
            Don't miss out on these transformative opportunities!
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {events && events.map((event) => {
            const registration = registrations[event.id]
            const isRegistered = !!registration
            const canRegister = isRegistrationOpen(event) && !isRegistered && !isEventFull(event)

            return (
              <Card key={event.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                {event.bannerImage && (
                  <div className="h-48 overflow-hidden">
                    <img 
                      src={event.bannerImage} 
                      alt={event.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between mb-2">
                    <Badge 
                      className={`${getEventTypeColor(event.type)} text-white text-xs px-2 py-1`}
                    >
                      {getEventTypeLabel(event.type)}
                    </Badge>
                    {event.isFree ? (
                      <Badge variant="secondary" className="bg-green-100 text-green-800">
                        FREE
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="flex items-center gap-1">
                        <DollarSign className="h-3 w-3" />
                        ₦{parseFloat(event.price).toLocaleString()}
                      </Badge>
                    )}
                  </div>
                  
                  <CardTitle className="text-xl mb-2 line-clamp-2">
                    {event.title}
                  </CardTitle>
                  
                  <CardDescription className="line-clamp-3">
                    {event.shortDescription || event.description}
                  </CardDescription>
                </CardHeader>

                <CardContent className="space-y-4">
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                      <CalendarDays className="h-4 w-4" />
                      <span>{formatDate(event.startDate)}</span>
                    </div>
                    
                    <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                      <Clock className="h-4 w-4" />
                      <span>
                        {formatTime(event.startDate)}
                        {event.endDate && ` - ${formatTime(event.endDate)}`}
                      </span>
                    </div>

                    {event.isOnline ? (
                      <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                        <Globe className="h-4 w-4" />
                        <span>Online Event</span>
                      </div>
                    ) : event.location && (
                      <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                        <MapPin className="h-4 w-4" />
                        <span className="line-clamp-1">{event.location}</span>
                      </div>
                    )}

                    {event.maxAttendees && (
                      <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                        <Users className="h-4 w-4" />
                        <span>
                          {event.registrationCount}/{event.maxAttendees} registered
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="pt-4 border-t">
                    {isRegistered ? (
                      <div className="space-y-2">
                        <Badge 
                          variant={registration.status === 'registered' ? 'default' : 'secondary'}
                          className="w-full justify-center py-2"
                        >
                          {registration.status === 'registered' && 'Registered'}
                          {registration.status === 'attended' && 'Attended'}
                          {registration.status === 'cancelled' && 'Cancelled'}
                          {registration.status === 'no_show' && 'No Show'}
                        </Badge>
                        
                        {registration.paymentStatus === 'pending' && (
                          <p className="text-sm text-orange-600 dark:text-orange-400 text-center">
                            Payment pending
                          </p>
                        )}
                      </div>
                    ) : (
                      <Button
                        onClick={() => handleRegister(event.id)}
                        disabled={!canRegister || registering === event.id}
                        className="w-full"
                        variant={canRegister ? "default" : "secondary"}
                      >
                        {registering === event.id && "Registering..."}
                        {!registering && canRegister && "Register Now"}
                        {!registering && isEventFull(event) && "Event Full"}
                        {!registering && !isRegistrationOpen(event) && !isEventFull(event) && "Registration Closed"}
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        <div className="text-center mt-12">
          <Button variant="outline" size="lg" className="px-8">
            View All Events
          </Button>
        </div>
      </div>
    </section>
  )
}
