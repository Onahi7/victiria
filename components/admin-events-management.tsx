'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { CalendarDays, Clock, MapPin, Users, Globe, DollarSign, Upload, Plus, Edit, Trash2, Eye } from 'lucide-react'
import { useSession } from 'next-auth/react'
import { toast } from '@/hooks/use-toast'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'

interface Event {
  id: string
  title: string
  description: string
  shortDescription: string
  eventType: 'workshop' | 'webinar' | 'book_launch' | 'masterclass' | 'meet_greet' | 'conference'
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
  createdAt: string
  updatedAt: string
  _count: {
    registrations: number
  }
}

const eventTypes = [
  { value: 'workshop', label: 'Workshop' },
  { value: 'webinar', label: 'Webinar' },
  { value: 'book_launch', label: 'Book Launch' },
  { value: 'masterclass', label: 'Masterclass' },
  { value: 'meet_greet', label: 'Meet & Greet' },
  { value: 'conference', label: 'Conference' }
]

const statusOptions = [
  { value: 'draft', label: 'Draft' },
  { value: 'published', label: 'Published' },
  { value: 'cancelled', label: 'Cancelled' },
  { value: 'completed', label: 'Completed' }
]

interface EventFormData {
  title: string
  description: string
  shortDescription: string
  eventType: string
  startDate: string
  endDate: string
  location: string
  isOnline: boolean
  meetingLink: string
  price: string
  isFree: boolean
  maxAttendees: string
  requirements: string
  agenda: string
  bannerImage: string
  isPublished: boolean
  status: string
  registrationDeadline: string
}

const initialFormData: EventFormData = {
  title: '',
  description: '',
  shortDescription: '',
  eventType: 'workshop',
  startDate: '',
  endDate: '',
  location: '',
  isOnline: false,
  meetingLink: '',
  price: '0',
  isFree: true,
  maxAttendees: '',
  requirements: '',
  agenda: '',
  bannerImage: '',
  isPublished: false,
  status: 'draft',
  registrationDeadline: ''
}

export default function AdminEventsManagement() {
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [editing, setEditing] = useState<string | null>(null)
  const [formData, setFormData] = useState<EventFormData>(initialFormData)
  const [showForm, setShowForm] = useState(false)
  const { data: session } = useSession()

  useEffect(() => {
    fetchEvents()
  }, [])

  const fetchEvents = async () => {
    try {
      const response = await fetch('/api/admin/events')
      if (!response.ok) throw new Error('Failed to fetch events')
      
      const data = await response.json()
      if (data.success) {
        setEvents(data.data.events.map((event: any) => ({
          ...event,
          _count: { registrations: event.registrationCount || 0 }
        })))
      }
    } catch (error) {
      console.error('Error fetching events:', error)
      toast({
        title: "Error",
        description: "Failed to load events",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: keyof EventFormData, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))

    // Auto-update price when isFree changes
    if (field === 'isFree' && value === true) {
      setFormData(prev => ({ ...prev, price: '0' }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!session) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to manage events",
        variant: "destructive"
      })
      return
    }

    const isEditing = !!editing
    setCreating(true)

    try {
      const url = isEditing ? '/api/admin/events' : '/api/admin/events'
      const method = isEditing ? 'PUT' : 'POST'

      const payload = {
        ...formData,
        ...(isEditing && { id: editing }),
        maxAttendees: formData.maxAttendees ? parseInt(formData.maxAttendees) : null,
        price: formData.isFree ? '0' : formData.price,
        registrationDeadline: formData.registrationDeadline || null,
        endDate: formData.endDate || null,
        location: formData.isOnline ? null : formData.location,
        meetingUrl: formData.isOnline ? formData.meetingLink : null
      }

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      })

      const data = await response.json()

      if (data.success) {
        toast({
          title: isEditing ? "Event Updated" : "Event Created",
          description: data.message,
        })
        
        setShowForm(false)
        setEditing(null)
        setFormData(initialFormData)
        fetchEvents()
      } else {
        toast({
          title: isEditing ? "Update Failed" : "Creation Failed",
          description: data.error,
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error('Error saving event:', error)
      toast({
        title: "Error",
        description: "Failed to save event",
        variant: "destructive"
      })
    } finally {
      setCreating(false)
    }
  }

  const handleEdit = (event: Event) => {
    setFormData({
      title: event.title,
      description: event.description,
      shortDescription: event.shortDescription,
      eventType: event.eventType,
      startDate: new Date(event.startDate).toISOString().slice(0, 16),
      endDate: event.endDate ? new Date(event.endDate).toISOString().slice(0, 16) : '',
      location: event.location || '',
      isOnline: event.isOnline,
      meetingLink: event.meetingLink || '',
      price: event.price,
      isFree: event.isFree,
      maxAttendees: event.maxAttendees?.toString() || '',
      requirements: event.requirements || '',
      agenda: event.agenda || '',
      bannerImage: event.bannerImage || '',
      isPublished: event.isPublished,
      status: event.status,
      registrationDeadline: event.registrationDeadline 
        ? new Date(event.registrationDeadline).toISOString().slice(0, 16) 
        : ''
    })
    setEditing(event.id)
    setShowForm(true)
  }

  const handleDelete = async (eventId: string) => {
    if (!confirm('Are you sure you want to delete this event?')) return

    try {
      const response = await fetch(`/api/admin/events?id=${eventId}`, {
        method: 'DELETE'
      })

      const data = await response.json()

      if (data.success) {
        toast({
          title: "Event Deleted",
          description: "Event has been deleted successfully",
        })
        fetchEvents()
      } else {
        toast({
          title: "Deletion Failed",
          description: data.error,
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error('Error deleting event:', error)
      toast({
        title: "Error",
        description: "Failed to delete event",
        variant: "destructive"
      })
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      draft: 'bg-gray-500',
      published: 'bg-green-500',
      cancelled: 'bg-red-500',
      completed: 'bg-blue-500'
    }
    return colors[status] || 'bg-gray-500'
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">Loading events...</div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Events Management
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Create and manage events for your platform
          </p>
        </div>
        
        <Dialog open={showForm} onOpenChange={setShowForm}>
          <DialogTrigger asChild>
            <Button
              onClick={() => {
                setFormData(initialFormData)
                setEditing(null)
                setShowForm(true)
              }}
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Create Event
            </Button>
          </DialogTrigger>
          
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editing ? 'Edit Event' : 'Create New Event'}
              </DialogTitle>
              <DialogDescription>
                {editing 
                  ? 'Update the event details below' 
                  : 'Fill in the details to create a new event'
                }
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="title">Event Title *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => handleInputChange('title', e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="eventType">Event Type *</Label>
                  <Select
                    value={formData.eventType}
                    onValueChange={(value) => handleInputChange('eventType', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {eventTypes.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="startDate">Start Date & Time *</Label>
                  <Input
                    id="startDate"
                    type="datetime-local"
                    value={formData.startDate}
                    onChange={(e) => handleInputChange('startDate', e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="endDate">End Date & Time</Label>
                  <Input
                    id="endDate"
                    type="datetime-local"
                    value={formData.endDate}
                    onChange={(e) => handleInputChange('endDate', e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="registrationDeadline">Registration Deadline</Label>
                  <Input
                    id="registrationDeadline"
                    type="datetime-local"
                    value={formData.registrationDeadline}
                    onChange={(e) => handleInputChange('registrationDeadline', e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="maxAttendees">Max Attendees</Label>
                  <Input
                    id="maxAttendees"
                    type="number"
                    value={formData.maxAttendees}
                    onChange={(e) => handleInputChange('maxAttendees', e.target.value)}
                    placeholder="Leave blank for unlimited"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="shortDescription">Short Description *</Label>
                <Textarea
                  id="shortDescription"
                  value={formData.shortDescription}
                  onChange={(e) => handleInputChange('shortDescription', e.target.value)}
                  placeholder="Brief description for event cards"
                  rows={2}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Full Description *</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="Detailed description of the event"
                  rows={4}
                  required
                />
              </div>

              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="isOnline"
                    checked={formData.isOnline}
                    onCheckedChange={(checked) => handleInputChange('isOnline', !!checked)}
                  />
                  <Label htmlFor="isOnline">This is an online event</Label>
                </div>

                {formData.isOnline ? (
                  <div className="space-y-2">
                    <Label htmlFor="meetingLink">Meeting Link</Label>
                    <Input
                      id="meetingLink"
                      value={formData.meetingLink}
                      onChange={(e) => handleInputChange('meetingLink', e.target.value)}
                      placeholder="Zoom, Google Meet, or other meeting link"
                    />
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Label htmlFor="location">Location *</Label>
                    <Input
                      id="location"
                      value={formData.location}
                      onChange={(e) => handleInputChange('location', e.target.value)}
                      placeholder="Physical location address"
                      required={!formData.isOnline}
                    />
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="isFree"
                    checked={formData.isFree}
                    onCheckedChange={(checked) => handleInputChange('isFree', !!checked)}
                  />
                  <Label htmlFor="isFree">This is a free event</Label>
                </div>

                {!formData.isFree && (
                  <div className="space-y-2">
                    <Label htmlFor="price">Price (NGN) *</Label>
                    <Input
                      id="price"
                      type="number"
                      step="0.01"
                      value={formData.price}
                      onChange={(e) => handleInputChange('price', e.target.value)}
                      required={!formData.isFree}
                    />
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="requirements">Requirements</Label>
                  <Textarea
                    id="requirements"
                    value={formData.requirements}
                    onChange={(e) => handleInputChange('requirements', e.target.value)}
                    placeholder="What attendees need to bring or prepare"
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="agenda">Agenda</Label>
                  <Textarea
                    id="agenda"
                    value={formData.agenda}
                    onChange={(e) => handleInputChange('agenda', e.target.value)}
                    placeholder="Event schedule and activities"
                    rows={3}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="bannerImage">Banner Image URL</Label>
                <Input
                  id="bannerImage"
                  value={formData.bannerImage}
                  onChange={(e) => handleInputChange('bannerImage', e.target.value)}
                  placeholder="URL to event banner image"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value) => handleInputChange('status', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {statusOptions.map((status) => (
                        <SelectItem key={status.value} value={status.value}>
                          {status.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="isPublished"
                      checked={formData.isPublished}
                      onCheckedChange={(checked) => handleInputChange('isPublished', !!checked)}
                    />
                    <Label htmlFor="isPublished">Publish event (visible to users)</Label>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-4 pt-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowForm(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={creating}>
                  {creating ? 'Saving...' : editing ? 'Update Event' : 'Create Event'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {events.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <CalendarDays className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              No events yet
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Create your first event to get started
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {events.map((event) => (
            <Card key={event.id} className="overflow-hidden">
              {event.bannerImage && (
                <div className="h-40 overflow-hidden">
                  <img 
                    src={event.bannerImage} 
                    alt={event.title}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between mb-2">
                  <Badge className="text-xs">
                    {eventTypes.find(type => type.value === event.eventType)?.label}
                  </Badge>
                  <div className="flex gap-1">
                    <Badge 
                      className={`${getStatusColor(event.status)} text-white text-xs`}
                    >
                      {event.status}
                    </Badge>
                    {event.isPublished && (
                      <Badge variant="secondary" className="text-xs">
                        Published
                      </Badge>
                    )}
                  </div>
                </div>
                
                <CardTitle className="text-lg line-clamp-2">
                  {event.title}
                </CardTitle>
                
                <CardDescription className="line-clamp-2">
                  {event.shortDescription}
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-3">
                <div className="space-y-1 text-sm">
                  <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                    <CalendarDays className="h-4 w-4" />
                    <span>{formatDate(event.startDate)}</span>
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

                  <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                    <DollarSign className="h-4 w-4" />
                    <span>
                      {event.isFree ? 'Free' : `₦${parseFloat(event.price).toLocaleString()}`}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                    <Users className="h-4 w-4" />
                    <span>
                      {event._count.registrations} registered
                      {event.maxAttendees && ` / ${event.maxAttendees}`}
                    </span>
                  </div>
                </div>

                <div className="flex gap-2 pt-3 border-t">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(event)}
                    className="flex-1"
                  >
                    <Edit className="h-4 w-4 mr-1" />
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(event.id)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
