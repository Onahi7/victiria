"use client"

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import { 
  Upload, 
  BookOpen, 
  FileText, 
  Image as ImageIcon,
  DollarSign,
  CheckCircle,
  AlertTriangle,
  Info
} from "lucide-react"

interface FormData {
  title: string
  subtitle: string
  description: string
  genre: string
  targetAudience: string
  wordCount: string
  language: string
  tags: string
  authorBio: string
  marketingPlan: string
}

export default function NewSubmissionPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<any>({})
  
  const [formData, setFormData] = useState<FormData>({
    title: '',
    subtitle: '',
    description: '',
    genre: '',
    targetAudience: '',
    wordCount: '',
    language: 'English',
    tags: '',
    authorBio: '',
    marketingPlan: ''
  })

  const [files, setFiles] = useState({
    manuscript: null as File | null,
    coverImage: null as File | null,
    synopsis: null as File | null
  })

  const genres = [
    'Fiction', 'Non-Fiction', 'Romance', 'Mystery', 'Science Fiction', 'Fantasy',
    'Thriller', 'Horror', 'Historical Fiction', 'Biography', 'Self-Help',
    'Business', 'Health & Wellness', 'Children\'s', 'Young Adult', 'Poetry',
    'Education', 'Religion & Spirituality', 'Politics', 'Travel', 'Cooking',
    'Art & Design', 'Technology', 'Science', 'Philosophy', 'Other'
  ]

  const targetAudiences = [
    'General Adult', 'Young Adult', 'Children (5-12)', 'Teens (13-17)',
    'College Students', 'Professionals', 'Parents', 'Seniors', 'Academic',
    'Business Leaders', 'Educators', 'Healthcare Professionals', 'Other'
  ]

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors((prev: any) => ({ ...prev, [field]: '' }))
    }
  }

  const handleFileChange = (field: keyof typeof files, file: File | null) => {
    setFiles(prev => ({ ...prev, [field]: file }))
    if (errors[field]) {
      setErrors((prev: any) => ({ ...prev, [field]: '' }))
    }
  }

  const validateStep = (step: number): boolean => {
    const newErrors: any = {}

    if (step === 1) {
      if (!formData.title.trim()) newErrors.title = 'Title is required'
      if (!formData.description.trim()) newErrors.description = 'Description is required'
      if (!formData.genre) newErrors.genre = 'Genre is required'
      if (!formData.targetAudience) newErrors.targetAudience = 'Target audience is required'
      if (!formData.wordCount.trim()) newErrors.wordCount = 'Word count is required'
    }

    if (step === 2) {
      if (!files.manuscript) newErrors.manuscript = 'Manuscript file is required'
      if (!files.coverImage) newErrors.coverImage = 'Cover image is required'
      if (!formData.authorBio.trim()) newErrors.authorBio = 'Author bio is required'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => prev + 1)
    }
  }

  const prevStep = () => {
    setCurrentStep(prev => prev - 1)
  }

  const handleSubmit = async (action: 'draft' | 'submit') => {
    if (action === 'submit' && !validateStep(2)) {
      return
    }

    setLoading(true)
    
    try {
      // Create FormData for file upload
      const submitData = new FormData()
      
      // Add form fields
      Object.entries(formData).forEach(([key, value]) => {
        submitData.append(key, value)
      })

      // Add files
      if (files.manuscript) submitData.append('manuscript', files.manuscript)
      if (files.coverImage) submitData.append('coverImage', files.coverImage)
      if (files.synopsis) submitData.append('synopsis', files.synopsis)

      submitData.append('status', action === 'draft' ? 'draft' : 'submitted')

      const response = await fetch('/api/publishing/submissions', {
        method: 'POST',
        body: submitData
      })

      const result = await response.json()

      if (result.success) {
        if (action === 'submit') {
          // Redirect to payment page
          router.push(`/publishing/submissions/${result.data.id}/pay`)
        } else {
          // Redirect to submissions list
          router.push('/publishing/submissions')
        }
      } else {
        setErrors({ submit: result.error || 'Failed to create submission' })
      }
    } catch (error) {
      console.error('Error creating submission:', error)
      setErrors({ submit: 'An error occurred while creating your submission' })
    } finally {
      setLoading(false)
    }
  }

  const progress = (currentStep / 3) * 100

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="container py-8 max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-pink-600 mb-2">
            Submit Your Book
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300">
            Share your story with the world through our publishing platform
          </p>
        </div>

        {/* Progress Bar */}
        <Card className="mb-8">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-medium">Step {currentStep} of 3</span>
              <span className="text-sm text-gray-600 dark:text-gray-400">{Math.round(progress)}% Complete</span>
            </div>
            <Progress value={progress} className="mb-4" />
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div className={`text-center ${currentStep >= 1 ? 'text-purple-600 dark:text-purple-400' : 'text-gray-400'}`}>
                <BookOpen className="w-5 h-5 mx-auto mb-1" />
                Book Details
              </div>
              <div className={`text-center ${currentStep >= 2 ? 'text-purple-600 dark:text-purple-400' : 'text-gray-400'}`}>
                <Upload className="w-5 h-5 mx-auto mb-1" />
                Files & Bio
              </div>
              <div className={`text-center ${currentStep >= 3 ? 'text-purple-600 dark:text-purple-400' : 'text-gray-400'}`}>
                <CheckCircle className="w-5 h-5 mx-auto mb-1" />
                Review & Submit
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Step 1: Book Details */}
        {currentStep === 1 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="w-5 h-5" />
                Book Information
              </CardTitle>
              <CardDescription>
                Tell us about your book - this information will be used for marketing and categorization
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="title">Book Title *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => handleInputChange('title', e.target.value)}
                    placeholder="Enter your book title"
                    className={errors.title ? 'border-red-500' : ''}
                  />
                  {errors.title && <p className="text-sm text-red-500">{errors.title}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="subtitle">Subtitle (Optional)</Label>
                  <Input
                    id="subtitle"
                    value={formData.subtitle}
                    onChange={(e) => handleInputChange('subtitle', e.target.value)}
                    placeholder="Enter subtitle if applicable"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Book Description *</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="Provide a compelling description of your book (back cover text)"
                  rows={4}
                  className={errors.description ? 'border-red-500' : ''}
                />
                {errors.description && <p className="text-sm text-red-500">{errors.description}</p>}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="genre">Genre *</Label>
                  <Select value={formData.genre} onValueChange={(value) => handleInputChange('genre', value)}>
                    <SelectTrigger className={errors.genre ? 'border-red-500' : ''}>
                      <SelectValue placeholder="Select your book's genre" />
                    </SelectTrigger>
                    <SelectContent>
                      {genres.map(genre => (
                        <SelectItem key={genre} value={genre}>{genre}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.genre && <p className="text-sm text-red-500">{errors.genre}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="targetAudience">Target Audience *</Label>
                  <Select value={formData.targetAudience} onValueChange={(value) => handleInputChange('targetAudience', value)}>
                    <SelectTrigger className={errors.targetAudience ? 'border-red-500' : ''}>
                      <SelectValue placeholder="Select target audience" />
                    </SelectTrigger>
                    <SelectContent>
                      {targetAudiences.map(audience => (
                        <SelectItem key={audience} value={audience}>{audience}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.targetAudience && <p className="text-sm text-red-500">{errors.targetAudience}</p>}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="wordCount">Word Count *</Label>
                  <Input
                    id="wordCount"
                    value={formData.wordCount}
                    onChange={(e) => handleInputChange('wordCount', e.target.value)}
                    placeholder="e.g., 80,000"
                    type="number"
                    className={errors.wordCount ? 'border-red-500' : ''}
                  />
                  {errors.wordCount && <p className="text-sm text-red-500">{errors.wordCount}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="language">Language</Label>
                  <Select value={formData.language} onValueChange={(value) => handleInputChange('language', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="English">English</SelectItem>
                      <SelectItem value="French">French</SelectItem>
                      <SelectItem value="Spanish">Spanish</SelectItem>
                      <SelectItem value="German">German</SelectItem>
                      <SelectItem value="Italian">Italian</SelectItem>
                      <SelectItem value="Portuguese">Portuguese</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="tags">Keywords/Tags (Optional)</Label>
                <Input
                  id="tags"
                  value={formData.tags}
                  onChange={(e) => handleInputChange('tags', e.target.value)}
                  placeholder="romance, contemporary, family, secrets (comma-separated)"
                />
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Add relevant keywords to help readers discover your book
                </p>
              </div>

              <div className="flex justify-end">
                <Button onClick={nextStep}>
                  Next Step
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Files & Bio */}
        {currentStep === 2 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="w-5 h-5" />
                Upload Files & Author Information
              </CardTitle>
              <CardDescription>
                Upload your manuscript and other required files
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* File Uploads */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="manuscript">Manuscript File *</Label>
                  <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center">
                    <FileText className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                    <div className="space-y-2">
                      <p className="text-sm">Upload your complete manuscript</p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">Accepted formats: PDF, DOC, DOCX</p>
                      <Input
                        type="file"
                        accept=".pdf,.doc,.docx"
                        onChange={(e) => handleFileChange('manuscript', e.target.files?.[0] || null)}
                        className="mt-2"
                      />
                      {files.manuscript && (
                        <p className="text-sm text-green-600 dark:text-green-400">
                          ✓ {files.manuscript.name}
                        </p>
                      )}
                    </div>
                  </div>
                  {errors.manuscript && <p className="text-sm text-red-500">{errors.manuscript}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="coverImage">Cover Image *</Label>
                  <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center">
                    <ImageIcon className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                    <div className="space-y-2">
                      <p className="text-sm">Upload your book cover</p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">High-resolution JPG, PNG (minimum 1600x2400px)</p>
                      <Input
                        type="file"
                        accept=".jpg,.jpeg,.png"
                        onChange={(e) => handleFileChange('coverImage', e.target.files?.[0] || null)}
                        className="mt-2"
                      />
                      {files.coverImage && (
                        <p className="text-sm text-green-600 dark:text-green-400">
                          ✓ {files.coverImage.name}
                        </p>
                      )}
                    </div>
                  </div>
                  {errors.coverImage && <p className="text-sm text-red-500">{errors.coverImage}</p>}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="synopsis">Synopsis (Optional)</Label>
                <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center">
                  <FileText className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                  <div className="space-y-2">
                    <p className="text-sm">Upload a detailed synopsis (1-2 pages)</p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">PDF, DOC, DOCX</p>
                    <Input
                      type="file"
                      accept=".pdf,.doc,.docx"
                      onChange={(e) => handleFileChange('synopsis', e.target.files?.[0] || null)}
                      className="mt-2"
                    />
                    {files.synopsis && (
                      <p className="text-sm text-green-600 dark:text-green-400">
                        ✓ {files.synopsis.name}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="authorBio">Author Biography *</Label>
                <Textarea
                  id="authorBio"
                  value={formData.authorBio}
                  onChange={(e) => handleInputChange('authorBio', e.target.value)}
                  placeholder="Tell readers about yourself - your background, writing experience, and what inspired you to write this book"
                  rows={4}
                  className={errors.authorBio ? 'border-red-500' : ''}
                />
                {errors.authorBio && <p className="text-sm text-red-500">{errors.authorBio}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="marketingPlan">Marketing Plan (Optional)</Label>
                <Textarea
                  id="marketingPlan"
                  value={formData.marketingPlan}
                  onChange={(e) => handleInputChange('marketingPlan', e.target.value)}
                  placeholder="How do you plan to market your book? Include your platform, audience reach, and promotional strategies"
                  rows={3}
                />
              </div>

              <div className="flex justify-between">
                <Button variant="outline" onClick={prevStep}>
                  Previous Step
                </Button>
                <Button onClick={nextStep}>
                  Review Submission
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 3: Review & Submit */}
        {currentStep === 3 && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5" />
                  Review Your Submission
                </CardTitle>
                <CardDescription>
                  Please review all information before submitting
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Book Details Summary */}
                <div>
                  <h3 className="font-semibold mb-4">Book Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium">Title:</span> {formData.title}
                    </div>
                    {formData.subtitle && (
                      <div>
                        <span className="font-medium">Subtitle:</span> {formData.subtitle}
                      </div>
                    )}
                    <div>
                      <span className="font-medium">Genre:</span> {formData.genre}
                    </div>
                    <div>
                      <span className="font-medium">Target Audience:</span> {formData.targetAudience}
                    </div>
                    <div>
                      <span className="font-medium">Word Count:</span> {parseInt(formData.wordCount).toLocaleString()}
                    </div>
                    <div>
                      <span className="font-medium">Language:</span> {formData.language}
                    </div>
                  </div>
                  <div className="mt-4">
                    <span className="font-medium">Description:</span>
                    <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">{formData.description}</p>
                  </div>
                </div>

                {/* Files Summary */}
                <div>
                  <h3 className="font-semibold mb-4">Uploaded Files</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <span>Manuscript: {files.manuscript?.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <span>Cover Image: {files.coverImage?.name}</span>
                    </div>
                    {files.synopsis && (
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        <span>Synopsis: {files.synopsis.name}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Submission Fee Info */}
                <Alert>
                  <DollarSign className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Submission Fee: As determined by admin</strong><br />
                    This one-time fee covers the comprehensive review process. If your book is approved and published, 
                    you'll earn competitive royalties on all sales through our platform.
                  </AlertDescription>
                </Alert>

                {errors.submit && (
                  <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>{errors.submit}</AlertDescription>
                  </Alert>
                )}

                <div className="flex justify-between">
                  <Button variant="outline" onClick={prevStep}>
                    Previous Step
                  </Button>
                  <div className="space-x-2">
                    <Button
                      variant="outline"
                      onClick={() => handleSubmit('draft')}
                      disabled={loading}
                    >
                      Save as Draft
                    </Button>
                    <Button
                      onClick={() => handleSubmit('submit')}
                      disabled={loading}
                    >
                      {loading ? 'Submitting...' : 'Submit & Pay Fee'}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* What Happens Next */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Info className="w-5 h-5" />
                  What Happens Next?
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
                  <div>
                    <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center mx-auto mb-4">
                      <DollarSign className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                    </div>
                    <h3 className="font-semibold mb-2">Payment Processing</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Complete the submission fee as set by our admin team to begin the review process
                    </p>
                  </div>

                  <div>
                    <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center mx-auto mb-4">
                      <FileText className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                    </div>
                    <h3 className="font-semibold mb-2">Editorial Review</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Our editorial team reviews your submission (typically 5-10 business days)
                    </p>
                  </div>

                  <div>
                    <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center mx-auto mb-4">
                      <BookOpen className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                    </div>
                    <h3 className="font-semibold mb-2">Publication</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      If approved, your book goes live and you start earning competitive royalties on sales
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}
