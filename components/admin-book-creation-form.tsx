"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Upload, FileText, Image, DollarSign, Gift } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface BookFormData {
  title: string
  author: string
  description: string
  isFree: boolean
  price: number
  priceUsd: number
  priceNgn: number
  category: string
  status: string
  tags: string[]
  isbn: string
  publisher: string
  publishedYear: number
  pageCount: number
  language: string
  bookFile?: string
  frontCoverImage?: string
  backCoverImage?: string
}

const categories = [
  'Fiction', 'Non-Fiction', 'Romance', 'Mystery', 'Thriller', 'Science Fiction',
  'Fantasy', 'Biography', 'History', 'Self-Help', 'Business', 'Technology',
  'Health', 'Cooking', 'Travel', 'Children', 'Young Adult', 'Poetry'
]

const statuses = [
  { value: 'draft', label: 'Draft' },
  { value: 'pending_review', label: 'Pending Review' },
  { value: 'approved', label: 'Approved' },
  { value: 'published', label: 'Published' },
  { value: 'archived', label: 'Archived' }
]

export default function AdminBookCreationForm() {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [uploadingFile, setUploadingFile] = useState(false)
  const [uploadingCover, setUploadingCover] = useState(false)
  const [newTag, setNewTag] = useState("")
  
  const [formData, setFormData] = useState<BookFormData>({
    title: "",
    author: "",
    description: "",
    isFree: false,
    price: 0,
    priceUsd: 0,
    priceNgn: 0,
    category: "",
    status: "draft",
    tags: [],
    isbn: "",
    publisher: "",
    publishedYear: new Date().getFullYear(),
    pageCount: 0,
    language: "English",
  })

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleFileUpload = async (file: File, fileType: 'book' | 'cover') => {
    if (fileType === 'book') setUploadingFile(true)
    if (fileType === 'cover') setUploadingCover(true)

    try {
      const formDataUpload = new FormData()
      formDataUpload.append('file', file)
      formDataUpload.append('fileType', fileType)
      formDataUpload.append('bookId', 'temp_' + Date.now())

      const response = await fetch('/api/upload/book-file', {
        method: 'POST',
        body: formDataUpload,
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Upload failed')
      }

      // Update form data with file URL
      if (fileType === 'book') {
        handleInputChange('bookFile', result.fileUrl)
        toast({
          title: "Book file uploaded",
          description: `${file.name} uploaded successfully`,
        })
      } else if (fileType === 'cover') {
        handleInputChange('frontCoverImage', result.fileUrl)
        toast({
          title: "Cover image uploaded",
          description: `${file.name} uploaded successfully`,
        })
      }

    } catch (error) {
      console.error('Upload error:', error)
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : "Failed to upload file",
        variant: "destructive",
      })
    } finally {
      if (fileType === 'book') setUploadingFile(false)
      if (fileType === 'cover') setUploadingCover(false)
    }
  }

  const addTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      handleInputChange('tags', [...formData.tags, newTag.trim()])
      setNewTag("")
    }
  }

  const removeTag = (tagToRemove: string) => {
    handleInputChange('tags', formData.tags.filter(tag => tag !== tagToRemove))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch('/api/books', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to create book')
      }

      toast({
        title: "Book created successfully",
        description: `"${formData.title}" has been added to the catalog`,
      })

      // Reset form
      setFormData({
        title: "",
        author: "",
        description: "",
        isFree: false,
        price: 0,
        priceUsd: 0,
        priceNgn: 0,
        category: "",
        status: "draft",
        tags: [],
        isbn: "",
        publisher: "",
        publishedYear: new Date().getFullYear(),
        pageCount: 0,
        language: "English",
      })

    } catch (error) {
      console.error('Create book error:', error)
      toast({
        title: "Failed to create book",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold">Create New Book</h1>
        <p className="text-muted-foreground mt-2">Add a new book to the Victoria catalog</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
            <CardDescription>Essential book details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  placeholder="Enter book title"
                  required
                />
              </div>
              <div>
                <Label htmlFor="author">Author *</Label>
                <Input
                  id="author"
                  value={formData.author}
                  onChange={(e) => handleInputChange('author', e.target.value)}
                  placeholder="Enter author name"
                  required
                />
              </div>
            </div>

            <div>
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="Enter book description (minimum 10 characters)"
                rows={4}
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="category">Category *</Label>
                <Select value={formData.category} onValueChange={(value) => handleInputChange('category', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="status">Status</Label>
                <Select value={formData.status} onValueChange={(value) => handleInputChange('status', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {statuses.map((status) => (
                      <SelectItem key={status.value} value={status.value}>
                        {status.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Pricing */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {formData.isFree ? <Gift className="h-5 w-5" /> : <DollarSign className="h-5 w-5" />}
              Pricing & Availability
            </CardTitle>
            <CardDescription>
              {formData.isFree ? "This book will be available for free download" : "Set pricing for different markets"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-2">
              <Switch
                id="isFree"
                checked={formData.isFree}
                onCheckedChange={(checked) => handleInputChange('isFree', checked)}
              />
              <Label htmlFor="isFree" className="flex items-center gap-2">
                {formData.isFree ? (
                  <>
                    <Gift className="h-4 w-4" />
                    Free Book
                  </>
                ) : (
                  <>
                    <DollarSign className="h-4 w-4" />
                    Paid Book
                  </>
                )}
              </Label>
            </div>

            {!formData.isFree && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="price">Default Price</Label>
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.price}
                    onChange={(e) => handleInputChange('price', parseFloat(e.target.value) || 0)}
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <Label htmlFor="priceUsd">Price (USD)</Label>
                  <Input
                    id="priceUsd"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.priceUsd}
                    onChange={(e) => handleInputChange('priceUsd', parseFloat(e.target.value) || 0)}
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <Label htmlFor="priceNgn">Price (NGN)</Label>
                  <Input
                    id="priceNgn"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.priceNgn}
                    onChange={(e) => handleInputChange('priceNgn', parseFloat(e.target.value) || 0)}
                    placeholder="0.00"
                  />
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* File Uploads */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              File Uploads
            </CardTitle>
            <CardDescription>Upload book file and cover images</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Book File Upload */}
            <div>
              <Label className="flex items-center gap-2 mb-2">
                <FileText className="h-4 w-4" />
                Book File (PDF/EPUB)
                {formData.isFree && <Badge variant="secondary">Required for free books</Badge>}
              </Label>
              <div className="border-2 border-dashed rounded-lg p-6 text-center">
                {formData.bookFile ? (
                  <div className="text-green-600">
                    <FileText className="h-8 w-8 mx-auto mb-2" />
                    <p>Book file uploaded successfully</p>
                    <p className="text-sm text-gray-500">{formData.bookFile}</p>
                  </div>
                ) : (
                  <div>
                    <FileText className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                    <p className="text-gray-500">No book file uploaded</p>
                  </div>
                )}
                <input
                  type="file"
                  accept=".pdf,.epub"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) handleFileUpload(file, 'book')
                  }}
                  className="mt-2"
                  disabled={uploadingFile}
                />
                {uploadingFile && <p className="text-blue-500 mt-2">Uploading...</p>}
              </div>
            </div>

            {/* Cover Image Upload */}
            <div>
              <Label className="flex items-center gap-2 mb-2">
                <Image className="h-4 w-4" />
                Front Cover Image
              </Label>
              <div className="border-2 border-dashed rounded-lg p-6 text-center">
                {formData.frontCoverImage ? (
                  <div className="text-green-600">
                    <Image className="h-8 w-8 mx-auto mb-2" />
                    <p>Cover image uploaded successfully</p>
                    <img 
                      src={formData.frontCoverImage} 
                      alt="Cover preview" 
                      className="max-w-32 max-h-48 mx-auto mt-2 rounded"
                    />
                  </div>
                ) : (
                  <div>
                    <Image className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                    <p className="text-gray-500">No cover image uploaded</p>
                  </div>
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) handleFileUpload(file, 'cover')
                  }}
                  className="mt-2"
                  disabled={uploadingCover}
                />
                {uploadingCover && <p className="text-blue-500 mt-2">Uploading...</p>}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Additional Details */}
        <Card>
          <CardHeader>
            <CardTitle>Additional Details</CardTitle>
            <CardDescription>Optional book information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="isbn">ISBN</Label>
                <Input
                  id="isbn"
                  value={formData.isbn}
                  onChange={(e) => handleInputChange('isbn', e.target.value)}
                  placeholder="978-0-123456-78-9"
                />
              </div>
              <div>
                <Label htmlFor="publisher">Publisher</Label>
                <Input
                  id="publisher"
                  value={formData.publisher}
                  onChange={(e) => handleInputChange('publisher', e.target.value)}
                  placeholder="Publisher name"
                />
              </div>
              <div>
                <Label htmlFor="publishedYear">Published Year</Label>
                <Input
                  id="publishedYear"
                  type="number"
                  min="1900"
                  max={new Date().getFullYear() + 1}
                  value={formData.publishedYear}
                  onChange={(e) => handleInputChange('publishedYear', parseInt(e.target.value) || new Date().getFullYear())}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="pageCount">Page Count</Label>
                <Input
                  id="pageCount"
                  type="number"
                  min="1"
                  value={formData.pageCount || ""}
                  onChange={(e) => handleInputChange('pageCount', parseInt(e.target.value) || 0)}
                  placeholder="Number of pages"
                />
              </div>
              <div>
                <Label htmlFor="language">Language</Label>
                <Input
                  id="language"
                  value={formData.language}
                  onChange={(e) => handleInputChange('language', e.target.value)}
                  placeholder="English"
                />
              </div>
            </div>

            {/* Tags */}
            <div>
              <Label>Tags</Label>
              <div className="flex gap-2 mb-2">
                <Input
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  placeholder="Add a tag"
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                />
                <Button type="button" onClick={addTag}>Add</Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {formData.tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="cursor-pointer" onClick={() => removeTag(tag)}>
                    {tag} ×
                  </Badge>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Submit Button */}
        <div className="flex justify-center">
          <Button 
            type="submit" 
            size="lg" 
            disabled={loading || uploadingFile || uploadingCover}
            className="w-full md:w-auto"
          >
            {loading ? "Creating Book..." : "Create Book"}
          </Button>
        </div>
      </form>
    </div>
  )
}
