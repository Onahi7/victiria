'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { BookOpen, Search, Plus, MoreHorizontal, Eye, Edit, Trash2, CheckCircle, XCircle, Archive, Star, DollarSign, Gift, Upload, FileText } from 'lucide-react'
import { toast } from '@/hooks/use-toast'

interface Book {
  id: string
  title: string
  author: string
  authorId: string | null
  description: string
  isFree: boolean
  price: string // Legacy field
  priceUsd?: string // USD price for PayPal/Stripe
  priceNgn?: string // NGN price for Paystack
  coverImage: string | null
  frontCoverImage?: string | null // Front cover image
  backCoverImage?: string | null // Back cover image
  bookFile?: string | null // PDF/EPUB file URL
  status: string
  category: string | null
  salesCount: number
  totalRevenue: string
  authorRevenue: string
  isAvailable: boolean
  publishedAt: string | null
  createdAt: string
  authorUser: {
    name: string | null
    email: string | null
  } | null
  reviewCount: number
  averageRating: number | null
  orderCount: number
}

export default function AdminBooksManagement() {
  const [books, setBooks] = useState<Book[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [selectedBook, setSelectedBook] = useState<Book | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [editingBook, setEditingBook] = useState<Book | null>(null)

  // Form state for creating/editing books
  const [formData, setFormData] = useState({
    title: '',
    author: '',
    description: '',
    isFree: false,
    priceUsd: '',
    priceNgn: '',
    category: '',
    frontCoverImage: '',
    backCoverImage: '',
    bookFile: '',
    isbn: '',
    status: 'DRAFT'
  })

  // File upload states
  const [frontCoverFile, setFrontCoverFile] = useState<File | null>(null)
  const [backCoverFile, setBackCoverFile] = useState<File | null>(null)
  const [bookFile, setBookFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)

  const fetchBooks = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '10',
        search: searchTerm,
        status: statusFilter === 'all' ? '' : statusFilter
      })

      const response = await fetch(`/api/admin/books?${params}`)
      const result = await response.json()

      if (result.success) {
        setBooks(result.data.books)
        setTotalPages(result.data.pagination.pages)
      }
    } catch (error) {
      console.error('Error fetching books:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchBooks()
  }, [page, searchTerm, statusFilter])

  const handleStatusChange = async (bookId: string, action: string, additionalData?: any) => {
    try {
      const response = await fetch('/api/admin/books', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: bookId, action, ...additionalData })
      })

      const result = await response.json()
      if (result.success) {
        fetchBooks() // Refresh the list
      }
    } catch (error) {
      console.error('Error updating book:', error)
    }
  }

  const handleDelete = async (bookId: string) => {
    if (!confirm('Are you sure you want to delete this book?')) return

    try {
      const response = await fetch(`/api/admin/books?id=${bookId}`, {
        method: 'DELETE'
      })

      const result = await response.json()
      if (result.success) {
        fetchBooks() // Refresh the list
      } else {
        alert(result.error || 'Failed to delete book')
      }
    } catch (error) {
      console.error('Error deleting book:', error)
    }
  }

  const resetForm = () => {
    setFormData({
      title: '',
      author: '',
      description: '',
      isFree: false,
      priceUsd: '',
      priceNgn: '',
      category: '',
      frontCoverImage: '',
      backCoverImage: '',
      bookFile: '',
      isbn: '',
      status: 'DRAFT'
    })
    setFrontCoverFile(null)
    setBackCoverFile(null)
    setBookFile(null)
    setEditingBook(null)
    setIsCreating(false)
  }

  const uploadImage = async (file: File): Promise<string> => {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('folder', 'book-covers')
    
    const response = await fetch('/api/upload', {
      method: 'POST',
      body: formData
    })
    
    if (!response.ok) {
      throw new Error('Failed to upload image')
    }
    
    const result = await response.json()
    return result.data.url
  }

  const uploadBookFile = async (file: File): Promise<string> => {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('fileType', 'book')
    
    const response = await fetch('/api/upload/book-file', {
      method: 'POST',
      body: formData
    })
    
    if (!response.ok) {
      throw new Error('Failed to upload book file')
    }
    
    const result = await response.json()
    return result.fileUrl
  }

  const handleImageUpload = async (file: File, type: 'front' | 'back') => {
    try {
      setUploading(true)
      const imageUrl = await uploadImage(file)
      
      if (type === 'front') {
        setFormData({ ...formData, frontCoverImage: imageUrl })
      } else {
        setFormData({ ...formData, backCoverImage: imageUrl })
      }
      
      toast({
        title: "Success",
        description: `${type === 'front' ? 'Front' : 'Back'} cover uploaded successfully`,
      })
    } catch (error) {
      toast({
        title: "Error",
        description: `Failed to upload ${type === 'front' ? 'front' : 'back'} cover`,
        variant: "destructive"
      })
    } finally {
      setUploading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validate pricing for paid books
    if (!formData.isFree && !formData.priceUsd && !formData.priceNgn) {
      toast({
        title: "Validation Error",
        description: "Please set at least one price (USD or NGN) for paid books",
        variant: "destructive"
      })
      return
    }
    
    try {
      setUploading(true)
      
      // Upload images if files are selected
      let frontCoverUrl = formData.frontCoverImage
      let backCoverUrl = formData.backCoverImage
      let bookFileUrl = formData.bookFile
      
      if (frontCoverFile) {
        frontCoverUrl = await uploadImage(frontCoverFile)
      }
      
      if (backCoverFile) {
        backCoverUrl = await uploadImage(backCoverFile)
      }
      
      if (bookFile) {
        bookFileUrl = await uploadBookFile(bookFile)
      }
      
      // Use consistent admin API endpoints for both create and edit
      const url = editingBook 
        ? `/api/admin/books` 
        : '/api/admin/books'
      
      const method = editingBook ? 'PUT' : 'POST'
      
      // Prepare data based on the API endpoint requirements
      let requestData
      
      if (editingBook) {
        // For editing: use PUT with action or direct field updates
        requestData = {
          id: editingBook.id,
          title: formData.title,
          author: formData.author,
          description: formData.description,
          price: formData.isFree ? 0 : (formData.priceUsd || formData.priceNgn || 0),
          coverImage: frontCoverUrl,
          category: formData.category,
          status: formData.status.toLowerCase(),
          bookFile: bookFileUrl,
          isbn: formData.isbn || null,
          tags: [],
          stock: 0,
          digitalDownload: bookFileUrl,
        }
      } else {
        // For creating: use POST with admin API format
        requestData = {
          title: formData.title,
          author: formData.author,
          description: formData.description,
          // For free books, set a default price to satisfy constraint
          price: formData.isFree ? 0 : (
            formData.priceUsd ? parseFloat(formData.priceUsd) : 
            formData.priceNgn ? parseFloat(formData.priceNgn) : 0
          ),
          // For free books, set at least one price to 0 to satisfy the DB constraint
          priceUsd: formData.isFree ? 0 : (formData.priceUsd ? parseFloat(formData.priceUsd) : null),
          priceNgn: formData.isFree ? (formData.priceUsd ? null : 0) : (formData.priceNgn ? parseFloat(formData.priceNgn) : null),
          coverImage: frontCoverUrl,
          category: formData.category,
          bookFile: bookFileUrl,
          digitalDownload: bookFileUrl,
          isbn: formData.isbn || null,
          tags: [],
          stock: 0,
          language: 'English',
          royaltyRate: 70,
          isFree: formData.isFree
        }
      }
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      })

      const result = await response.json()

      if (response.ok) {
        toast({
          title: "Success",
          description: result.message || `Book ${editingBook ? 'updated' : 'created'} successfully`,
        })
        fetchBooks()
        resetForm()
      } else {
        console.error('API Error:', result)
        toast({
          title: "Error",
          description: result.error || result.details?.[0]?.message || 'Failed to save book',
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error('Submit Error:', error)
      toast({
        title: "Error",
        description: "Failed to save book",
        variant: "destructive"
      })
    } finally {
      setUploading(false)
    }
  }

  const handleEdit = (book: Book) => {
    setEditingBook(book)
    setFormData({
      title: book.title,
      author: book.author,
      description: book.description,
      isFree: book.isFree, // Add the missing isFree property
      priceUsd: book.priceUsd || '', // Will be populated from API if available
      priceNgn: book.priceNgn || '', // Will be populated from API if available
      category: book.category || '',
      frontCoverImage: book.coverImage || '', // Map existing coverImage to frontCover
      backCoverImage: book.backCoverImage || '', // New field, will be empty for existing books
      bookFile: book.bookFile || '', // Add the missing bookFile property
      isbn: '', // Assuming ISBN is not in the book interface
      status: book.status
    })
    setIsCreating(true)
  }

  const formatPrice = (book: Book) => {
    const prices = []
    
    // Show available prices
    if (book.priceUsd) {
      prices.push(`$${parseFloat(book.priceUsd).toFixed(2)}`)
    }
    if (book.priceNgn) {
      prices.push(`₦${parseFloat(book.priceNgn).toLocaleString()}`)
    }
    
    // Fallback to legacy price field if no new prices are set
    if (prices.length === 0 && book.price) {
      const numPrice = parseFloat(book.price)
      if (numPrice > 1000) {
        prices.push(`₦${numPrice.toLocaleString()}`)
      } else {
        prices.push(`$${numPrice.toFixed(2)}`)
      }
    }
    
    return prices.length > 0 ? prices.join(' / ') : 'Not set'
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      draft: { variant: 'secondary' as const, label: 'Draft' },
      pending_review: { variant: 'default' as const, label: 'Pending Review' },
      approved: { variant: 'default' as const, label: 'Approved' },
      published: { variant: 'default' as const, label: 'Published' },
      rejected: { variant: 'destructive' as const, label: 'Rejected' },
      archived: { variant: 'secondary' as const, label: 'Archived' }
    }

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.draft
    return <Badge variant={config.variant}>{config.label}</Badge>
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                Books Management
              </CardTitle>
              <CardDescription>
                Manage published books, manuscripts, and submissions
              </CardDescription>
            </div>
            <Button onClick={() => setIsCreating(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Book
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filters */}
          <div className="flex gap-4 items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search books by title, author, or description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="pending_review">Pending Review</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="published">Published</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
                <SelectItem value="archived">Archived</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Books Table */}
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Book</TableHead>
                  <TableHead>Author</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Sales</TableHead>
                  <TableHead>Rating</TableHead>
                  <TableHead>Revenue</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8">
                      Loading books...
                    </TableCell>
                  </TableRow>
                ) : books.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8">
                      No books found
                    </TableCell>
                  </TableRow>
                ) : (
                  books.map((book) => (
                    <TableRow key={book.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          {book.coverImage ? (
                            <img
                              src={book.coverImage}
                              alt={book.title}
                              className="w-10 h-12 object-cover rounded"
                            />
                          ) : (
                            <div className="w-10 h-12 bg-gray-200 rounded flex items-center justify-center">
                              <BookOpen className="h-4 w-4 text-gray-400" />
                            </div>
                          )}
                          <div>
                            <div className="font-medium">{book.title}</div>
                            <div className="text-sm text-gray-500">
                              {book.category}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{book.author}</div>
                          {book.authorUser && (
                            <div className="text-sm text-gray-500">
                              {book.authorUser.email}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(book.status)}
                      </TableCell>
                      <TableCell>{formatPrice(book)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <DollarSign className="h-3 w-3" />
                          {book.salesCount}
                        </div>
                      </TableCell>
                      <TableCell>
                        {book.averageRating ? (
                          <div className="flex items-center gap-1">
                            <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                            {book.averageRating} ({book.reviewCount})
                          </div>
                        ) : (
                          <span className="text-gray-400">No ratings</span>
                        )}
                      </TableCell>
                      <TableCell>
                        ₦{parseFloat(book.totalRevenue).toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => setSelectedBook(book)}>
                              <Eye className="h-4 w-4 mr-2" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleEdit(book)}>
                              <Edit className="h-4 w-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            {book.status === 'pending_review' && (
                              <>
                                <DropdownMenuItem
                                  onClick={() => handleStatusChange(book.id, 'approve')}
                                >
                                  <CheckCircle className="h-4 w-4 mr-2" />
                                  Approve
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => handleStatusChange(book.id, 'reject')}
                                >
                                  <XCircle className="h-4 w-4 mr-2" />
                                  Reject
                                </DropdownMenuItem>
                              </>
                            )}
                            {book.status === 'approved' && (
                              <DropdownMenuItem
                                onClick={() => handleStatusChange(book.id, 'publish')}
                              >
                                <CheckCircle className="h-4 w-4 mr-2" />
                                Publish
                              </DropdownMenuItem>
                            )}
                            {book.status === 'published' && (
                              <DropdownMenuItem
                                onClick={() => handleStatusChange(book.id, 'unpublish')}
                              >
                                <XCircle className="h-4 w-4 mr-2" />
                                Unpublish
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem
                              onClick={() => handleStatusChange(book.id, 'archive')}
                            >
                              <Archive className="h-4 w-4 mr-2" />
                              Archive
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleDelete(book.id)}
                              className="text-red-600"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          <div className="flex justify-between items-center">
            <p className="text-sm text-gray-600">
              Page {page} of {totalPages}
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(page - 1)}
                disabled={page === 1}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(page + 1)}
                disabled={page === totalPages}
              >
                Next
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Book Details Dialog */}
      <Dialog open={!!selectedBook} onOpenChange={() => setSelectedBook(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{selectedBook?.title}</DialogTitle>
            <DialogDescription>Book details and statistics</DialogDescription>
          </DialogHeader>
          {selectedBook && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium mb-2">Basic Information</h4>
                  <div className="space-y-2 text-sm">
                    <div><strong>Author:</strong> {selectedBook.author}</div>
                    <div><strong>Category:</strong> {selectedBook.category}</div>
                    <div><strong>Price:</strong> {formatPrice(selectedBook)}</div>
                    <div><strong>Status:</strong> {getStatusBadge(selectedBook.status)}</div>
                    <div><strong>Available:</strong> {selectedBook.isAvailable ? 'Yes' : 'No'}</div>
                  </div>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Performance</h4>
                  <div className="space-y-2 text-sm">
                    <div><strong>Sales:</strong> {selectedBook.salesCount}</div>
                    <div><strong>Total Revenue:</strong> ₦{parseFloat(selectedBook.totalRevenue).toLocaleString()}</div>
                    <div><strong>Author Revenue:</strong> ₦{parseFloat(selectedBook.authorRevenue).toLocaleString()}</div>
                    <div><strong>Reviews:</strong> {selectedBook.reviewCount}</div>
                    <div><strong>Rating:</strong> {selectedBook.averageRating || 'No ratings'}</div>
                  </div>
                </div>
              </div>
              <div>
                <h4 className="font-medium mb-2">Description</h4>
                <p className="text-sm text-gray-600">{selectedBook.description}</p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Create/Edit Book Dialog */}
      {isCreating && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <CardTitle>
                {editingBook ? 'Edit Book' : 'Create New Book'}
              </CardTitle>
              <CardDescription>
                {editingBook ? 'Update book information' : 'Add a new book to the catalog'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="title">Title *</Label>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      placeholder="Book title"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="author">Author *</Label>
                    <Input
                      id="author"
                      value={formData.author}
                      onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                      placeholder="Author name"
                      required
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="description">Description *</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Book description..."
                    rows={4}
                    required
                  />
                </div>

                {/* Free/Paid Toggle */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      {formData.isFree ? <Gift className="h-5 w-5" /> : <DollarSign className="h-5 w-5" />}
                      Book Type
                    </CardTitle>
                    <CardDescription>
                      {formData.isFree ? "This book will be available for free download" : "This book requires purchase to access"}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="isFree"
                        checked={formData.isFree}
                        onCheckedChange={(checked) => setFormData({ ...formData, isFree: checked })}
                      />
                      <Label htmlFor="isFree" className="flex items-center gap-2">
                        {formData.isFree ? (
                          <>
                            <Gift className="h-4 w-4" />
                            <span>Free Book</span>
                            <Badge variant="secondary">Users can download for free</Badge>
                          </>
                        ) : (
                          <>
                            <DollarSign className="h-4 w-4" />
                            <span>Paid Book</span>
                            <Badge variant="default">Requires purchase</Badge>
                          </>
                        )}
                      </Label>
                    </div>
                  </CardContent>
                </Card>

                {/* Book File Upload */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="h-5 w-5" />
                      Book File Upload
                    </CardTitle>
                    <CardDescription>
                      Upload the actual book file (PDF/EPUB) - {formData.isFree ? "Required for free books" : "Optional for paid books"}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div>
                      <Label htmlFor="bookFile">Book File (PDF/EPUB)</Label>
                      <Input
                        id="bookFile"
                        type="file"
                        accept=".pdf,.epub"
                        onChange={(e) => setBookFile(e.target.files?.[0] || null)}
                        className="mt-1"
                      />
                      {formData.bookFile && (
                        <div className="mt-2 text-sm text-green-600">
                          Current file: {formData.bookFile}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {!formData.isFree && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="priceUsd">Price in USD ($)</Label>
                        <Input
                          id="priceUsd"
                          type="number"
                          step="0.01"
                          value={formData.priceUsd}
                          onChange={(e) => setFormData({ ...formData, priceUsd: e.target.value })}
                          placeholder="29.99"
                        />
                        <div className="text-xs text-gray-500 mt-1">
                          PayPal/MTN MOMO checkout
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="priceNgn">Price in NGN (₦)</Label>
                        <Input
                          id="priceNgn"
                          type="number"
                          step="0.01"
                          value={formData.priceNgn}
                          onChange={(e) => setFormData({ ...formData, priceNgn: e.target.value })}
                          placeholder="15000"
                        />
                        <div className="text-xs text-gray-500 mt-1">
                          Paystack checkout
                        </div>
                      </div>
                    </div>
                    
                    <div className="text-sm text-blue-600 bg-blue-50 p-3 rounded">
                      💡 <strong>Tip:</strong> Set at least one price. Customers will see options for available currencies and be routed to the appropriate payment gateway.
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <Label htmlFor="category">Category</Label>
                    <Select
                      value={formData.category}
                      onValueChange={(value) => setFormData({ ...formData, category: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Fiction">Fiction</SelectItem>
                        <SelectItem value="Non-Fiction">Non-Fiction</SelectItem>
                        <SelectItem value="Mystery">Mystery</SelectItem>
                        <SelectItem value="Romance">Romance</SelectItem>
                        <SelectItem value="Science Fiction">Science Fiction</SelectItem>
                        <SelectItem value="Fantasy">Fantasy</SelectItem>
                        <SelectItem value="Biography">Biography</SelectItem>
                        <SelectItem value="History">History</SelectItem>
                        <SelectItem value="Self-Help">Self-Help</SelectItem>
                        <SelectItem value="Business">Business</SelectItem>
                        <SelectItem value="Technology">Technology</SelectItem>
                        <SelectItem value="Health">Health</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Cover Images Upload Section */}
                <div className="space-y-4">
                  <h4 className="text-sm font-medium">Cover Images (Optional)</h4>
                  
                  {/* Front Cover */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="frontCover">Front Cover</Label>
                      <div className="space-y-2">
                        <Input
                          id="frontCover"
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0]
                            if (file) {
                              setFrontCoverFile(file)
                              handleImageUpload(file, 'front')
                            }
                          }}
                          disabled={uploading}
                        />
                        {formData.frontCoverImage && (
                          <div className="text-xs text-green-600">✓ Front cover uploaded</div>
                        )}
                        <div className="text-xs text-gray-500">
                          Or paste URL below:
                        </div>
                        <Input
                          value={formData.frontCoverImage}
                          onChange={(e) => setFormData({ ...formData, frontCoverImage: e.target.value })}
                          placeholder="https://example.com/front-cover.jpg"
                        />
                      </div>
                    </div>
                    
                    {/* Back Cover */}
                    <div>
                      <Label htmlFor="backCover">Back Cover</Label>
                      <div className="space-y-2">
                        <Input
                          id="backCover"
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0]
                            if (file) {
                              setBackCoverFile(file)
                              handleImageUpload(file, 'back')
                            }
                          }}
                          disabled={uploading}
                        />
                        {formData.backCoverImage && (
                          <div className="text-xs text-green-600">✓ Back cover uploaded</div>
                        )}
                        <div className="text-xs text-gray-500">
                          Or paste URL below:
                        </div>
                        <Input
                          value={formData.backCoverImage}
                          onChange={(e) => setFormData({ ...formData, backCoverImage: e.target.value })}
                          placeholder="https://example.com/back-cover.jpg"
                        />
                      </div>
                    </div>
                  </div>
                  
                  {/* Preview Images */}
                  {(formData.frontCoverImage || formData.backCoverImage) && (
                    <div className="grid grid-cols-2 gap-4">
                      {formData.frontCoverImage && (
                        <div>
                          <div className="text-xs font-medium mb-1">Front Cover Preview:</div>
                          <img 
                            src={formData.frontCoverImage} 
                            alt="Front cover preview" 
                            className="w-full h-32 object-cover rounded border"
                            onError={(e) => {
                              e.currentTarget.src = '/placeholder.jpg'
                            }}
                          />
                        </div>
                      )}
                      {formData.backCoverImage && (
                        <div>
                          <div className="text-xs font-medium mb-1">Back Cover Preview:</div>
                          <img 
                            src={formData.backCoverImage} 
                            alt="Back cover preview" 
                            className="w-full h-32 object-cover rounded border"
                            onError={(e) => {
                              e.currentTarget.src = '/placeholder.jpg'
                            }}
                          />
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="isbn">ISBN</Label>
                    <Input
                      id="isbn"
                      value={formData.isbn}
                      onChange={(e) => setFormData({ ...formData, isbn: e.target.value })}
                      placeholder="978-0-123456-78-9"
                    />
                  </div>
                  <div>
                    <Label htmlFor="status">Status</Label>
                    <Select
                      value={formData.status}
                      onValueChange={(value) => setFormData({ ...formData, status: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="DRAFT">Draft</SelectItem>
                        <SelectItem value="PUBLISHED">Published</SelectItem>
                        <SelectItem value="ARCHIVED">Archived</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex justify-end space-x-2 pt-4">
                  <Button type="button" variant="outline" onClick={resetForm}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={uploading}>
                    {uploading ? 'Uploading...' : editingBook ? 'Update' : 'Create'} Book
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
