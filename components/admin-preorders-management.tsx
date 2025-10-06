'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { CalendarIcon, Plus, Edit, Trash2, Clock, Users, DollarSign } from 'lucide-react'
import { format } from 'date-fns'
import { toast } from '@/hooks/use-toast'

interface Book {
  id: string
  title: string
  author: string
  price: string
}

interface BookPreorder {
  id: string
  bookId: string
  book: Book
  preorderPrice: string
  originalPrice: string
  discountPercentage: number
  maxQuantity: number | null
  currentOrders: number
  startsAt: string
  endsAt: string
  releaseDate: string
  description: string
  isActive: boolean
  createdAt: string
}

export default function AdminPreordersManagement() {
  const [preorders, setPreorders] = useState<BookPreorder[]>([])
  const [books, setBooks] = useState<Book[]>([])
  const [loading, setLoading] = useState(true)
  const [editingPreorder, setEditingPreorder] = useState<BookPreorder | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [activeTab, setActiveTab] = useState('all')

  // Form states
  const [formData, setFormData] = useState({
    bookId: '',
    preorderPrice: '',
    discountPercentage: '',
    maxQuantity: '',
    startsAt: new Date(),
    endsAt: new Date(),
    releaseDate: new Date(),
    description: ''
  })

  useEffect(() => {
    fetchPreorders()
    fetchBooks()
  }, [activeTab])

  const fetchPreorders = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (activeTab !== 'all') {
        params.append('status', activeTab)
      }
      
      const response = await fetch(`/api/admin/preorders?${params.toString()}`)
      if (response.ok) {
        const result = await response.json()
        setPreorders(result.data)
      } else {
        toast({
          title: "Error",
          description: "Failed to fetch preorders",
          variant: "destructive"
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch preorders",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchBooks = async () => {
    try {
      const response = await fetch('/api/books')
      if (response.ok) {
        const result = await response.json()
        setBooks(result.data?.books || [])
      }
    } catch (error) {
      console.error('Failed to fetch books:', error)
      setBooks([])
    }
  }

  const resetForm = () => {
    setFormData({
      bookId: '',
      preorderPrice: '',
      discountPercentage: '',
      maxQuantity: '',
      startsAt: new Date(),
      endsAt: new Date(),
      releaseDate: new Date(),
      description: ''
    })
    setEditingPreorder(null)
    setIsCreating(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const url = editingPreorder 
        ? `/api/admin/preorders/${editingPreorder.id}` 
        : '/api/admin/preorders'
      
      const method = editingPreorder ? 'PUT' : 'POST'
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          preorderPrice: parseFloat(formData.preorderPrice),
          discountPercentage: formData.discountPercentage ? parseFloat(formData.discountPercentage) : null,
          maxQuantity: formData.maxQuantity ? parseInt(formData.maxQuantity) : null,
        }),
      })

      const result = await response.json()

      if (response.ok) {
        toast({
          title: "Success",
          description: result.message,
        })
        fetchPreorders()
        resetForm()
      } else {
        toast({
          title: "Error",
          description: result.error,
          variant: "destructive"
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save preorder",
        variant: "destructive"
      })
    }
  }

  const handleEdit = (preorder: BookPreorder) => {
    setEditingPreorder(preorder)
    setFormData({
      bookId: preorder.bookId,
      preorderPrice: preorder.preorderPrice,
      discountPercentage: preorder.discountPercentage.toString(),
      maxQuantity: preorder.maxQuantity?.toString() || '',
      startsAt: new Date(preorder.startsAt),
      endsAt: new Date(preorder.endsAt),
      releaseDate: new Date(preorder.releaseDate),
      description: preorder.description
    })
    setIsCreating(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this preorder? This action cannot be undone.')) return

    try {
      const response = await fetch(`/api/admin/preorders/${id}`, {
        method: 'DELETE',
      })

      const result = await response.json()

      if (response.ok) {
        toast({
          title: "Success",
          description: "Preorder deleted successfully",
        })
        fetchPreorders()
      } else {
        toast({
          title: "Error",
          description: result.error,
          variant: "destructive"
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete preorder",
        variant: "destructive"
      })
    }
  }

  const getPreorderStatus = (preorder: BookPreorder) => {
    const now = new Date()
    const startDate = new Date(preorder.startsAt)
    const endDate = new Date(preorder.endsAt)
    const releaseDate = new Date(preorder.releaseDate)

    if (!preorder.isActive) return { label: 'Inactive', variant: 'secondary' as const }
    if (now < startDate) return { label: 'Upcoming', variant: 'outline' as const }
    if (now > endDate) return { label: 'Ended', variant: 'destructive' as const }
    if (now > releaseDate) return { label: 'Released', variant: 'default' as const }
    if (preorder.maxQuantity && preorder.currentOrders >= preorder.maxQuantity) 
      return { label: 'Sold Out', variant: 'destructive' as const }
    return { label: 'Active', variant: 'default' as const }
  }

  const calculateOriginalPrice = (preorderPrice: string, discountPercentage: string) => {
    if (!preorderPrice || !discountPercentage) return ''
    const price = parseFloat(preorderPrice)
    const discount = parseFloat(discountPercentage)
    const original = price / (1 - discount / 100)
    return original.toFixed(2)
  }

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Book Preorders Management</h1>
        <Button onClick={() => setIsCreating(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Create Preorder
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="all">All Preorders</TabsTrigger>
          <TabsTrigger value="active">Active</TabsTrigger>
          <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
          <TabsTrigger value="ended">Ended</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-6">
          <div className="grid gap-4">
            {preorders.map((preorder) => {
              const status = getPreorderStatus(preorder)
              return (
                <Card key={preorder.id}>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        {preorder.book.title}
                        <Badge variant={status.variant}>{status.label}</Badge>
                      </CardTitle>
                      <CardDescription>by {preorder.book.author}</CardDescription>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(preorder)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(preorder.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4 text-green-600" />
                        <div>
                          <div className="text-sm font-medium">Preorder Price</div>
                          <div className="text-lg font-bold">${preorder.preorderPrice}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-blue-600" />
                        <div>
                          <div className="text-sm font-medium">Orders</div>
                          <div className="text-lg font-bold">
                            {preorder.currentOrders} / {preorder.maxQuantity || '∞'}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-purple-600" />
                        <div>
                          <div className="text-sm font-medium">Preorder Period</div>
                          <div className="text-sm">
                            {format(new Date(preorder.startsAt), 'MMM dd')} - {format(new Date(preorder.endsAt), 'MMM dd')}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <CalendarIcon className="h-4 w-4 text-orange-600" />
                        <div>
                          <div className="text-sm font-medium">Release Date</div>
                          <div className="text-sm">{format(new Date(preorder.releaseDate), 'MMM dd, yyyy')}</div>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 text-sm">
                      <div>
                        <span className="font-medium">Discount:</span> {preorder.discountPercentage}%
                      </div>
                      <div>
                        <span className="font-medium">Original Price:</span> ${preorder.originalPrice}
                      </div>
                      <div>
                        <span className="font-medium">Savings:</span> ${(parseFloat(preorder.originalPrice) - parseFloat(preorder.preorderPrice)).toFixed(2)}
                      </div>
                    </div>

                    {preorder.description && (
                      <p className="text-sm text-gray-600 mt-2">{preorder.description}</p>
                    )}
                  </CardContent>
                </Card>
              )
            })}

            {preorders.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                No preorders found for the selected filter.
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Create/Edit Modal */}
      {isCreating && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <CardTitle>
                {editingPreorder ? 'Edit Book Preorder' : 'Create New Book Preorder'}
              </CardTitle>
              <CardDescription>
                Set up early access sales for upcoming book releases
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="bookId">Select Book *</Label>
                  <Select
                    value={formData.bookId}
                    onValueChange={(value) => setFormData({ ...formData, bookId: value })}
                    disabled={!!editingPreorder}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a book" />
                    </SelectTrigger>
                    <SelectContent>
                      {books.map((book) => (
                        <SelectItem key={book.id} value={book.id}>
                          {book.title} by {book.author} (${book.price})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="preorderPrice">Preorder Price ($) *</Label>
                    <Input
                      id="preorderPrice"
                      type="number"
                      step="0.01"
                      value={formData.preorderPrice}
                      onChange={(e) => setFormData({ ...formData, preorderPrice: e.target.value })}
                      placeholder="24.99"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="discountPercentage">Discount Percentage (%)</Label>
                    <Input
                      id="discountPercentage"
                      type="number"
                      step="0.01"
                      value={formData.discountPercentage}
                      onChange={(e) => setFormData({ ...formData, discountPercentage: e.target.value })}
                      placeholder="20"
                    />
                    {formData.preorderPrice && formData.discountPercentage && (
                      <p className="text-xs text-gray-600 mt-1">
                        Original price would be: ${calculateOriginalPrice(formData.preorderPrice, formData.discountPercentage)}
                      </p>
                    )}
                  </div>
                </div>

                <div>
                  <Label htmlFor="maxQuantity">Maximum Preorders</Label>
                  <Input
                    id="maxQuantity"
                    type="number"
                    value={formData.maxQuantity}
                    onChange={(e) => setFormData({ ...formData, maxQuantity: e.target.value })}
                    placeholder="Leave empty for unlimited"
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label>Preorder Start Date *</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full justify-start text-left font-normal"
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {formData.startsAt ? format(formData.startsAt, 'PPP') : 'Pick a date'}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={formData.startsAt}
                          onSelect={(date) => date && setFormData({ ...formData, startsAt: date })}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                  <div>
                    <Label>Preorder End Date *</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full justify-start text-left font-normal"
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {formData.endsAt ? format(formData.endsAt, 'PPP') : 'Pick a date'}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={formData.endsAt}
                          onSelect={(date) => date && setFormData({ ...formData, endsAt: date })}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                  <div>
                    <Label>Book Release Date *</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full justify-start text-left font-normal"
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {formData.releaseDate ? format(formData.releaseDate, 'PPP') : 'Pick a date'}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={formData.releaseDate}
                          onSelect={(date) => date && setFormData({ ...formData, releaseDate: date })}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>

                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Special preorder campaign description..."
                    rows={3}
                  />
                </div>

                <div className="flex justify-end space-x-2 pt-4">
                  <Button type="button" variant="outline" onClick={resetForm}>
                    Cancel
                  </Button>
                  <Button type="submit">
                    {editingPreorder ? 'Update' : 'Create'} Preorder
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
