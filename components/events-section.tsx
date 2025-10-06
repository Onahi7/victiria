'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import { EventCard } from './event-card'

interface Event {
  id: string;
  title: string;
  date: string;
  location: string;
  type: 'Online' | 'In-Person';
  coverImage: string | null;
  slug: string;
}

export default function EventsSection() {
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const response = await fetch('/api/events?limit=4')
        if (!response.ok) {
          throw new Error('Failed to fetch events')
        }
        const data = await response.json()
        if (data.success) {
          setEvents(data.data)
        }
      } catch (error) {
        console.error('Error fetching events:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchEvents()
  }, [])

  if (loading) {
    return (
      <section className="py-12 md:py-16 lg:py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">Upcoming Events</h2>
            <p className="text-lg md:text-xl text-gray-600 dark:text-gray-300">
              Loading upcoming events...
            </p>
          </div>
        </div>
      </section>
    )
  }

  if (!events || events.length === 0) {
    return (
      <section className="py-12 md:py-16 lg:py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">Upcoming Events</h2>
            <p className="text-lg md:text-xl text-gray-600 dark:text-gray-300">
              No upcoming events at the moment. Please check back later.
            </p>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="py-12 md:py-16 lg:py-20">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
            Upcoming Events
          </h2>
          <p className="text-lg md:text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
            Join our community of authors and readers at these upcoming gatherings.
          </p>
        </div>

        {/* Mobile: Horizontal Scroll */}
        <div className="md:hidden">
          <div className="flex overflow-x-auto space-x-4 pb-4 -mx-4 px-4">
            {events.map((event) => (
              <div key={event.id} className="flex-shrink-0 w-4/5">
                <EventCard event={event} />
              </div>
            ))}
          </div>
        </div>

        {/* Desktop: Grid */}
        <div className="hidden md:grid md:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
          {events.map((event) => (
            <EventCard key={event.id} event={event} />
          ))}
        </div>

        <div className="text-center mt-12">
          <Button asChild size="lg">
            <Link href="/events" className="flex items-center">
              View All Events
              <ChevronRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  )
}
