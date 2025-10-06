"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Upload, FileText, Loader2, AlertCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { commonToasts, showSuccessToast, showErrorToast } from "@/lib/toast-utils"

interface ManuscriptSubmissionFormProps {
  onSuccess?: () => void
  onError?: (error: string) => void
}

export default function ManuscriptSubmissionForm({ onSuccess, onError }: ManuscriptSubmissionFormProps) {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "",
    genre: "",
    subgenre: "",
    wordCount: "",
    language: "english",
    targetAudience: "",
    themes: [] as string[],
    contentWarnings: [] as string[],
    isSeriesBook: false,
    seriesTitle: "",
    bookNumber: "",
    totalBooksPlanned: "",
    collaborators: "",
    previouslyPublished: false,
    publishingRights: "exclusive",
    expectedReleaseDate: "",
    marketingBudget: "",
    authorBio: "",
    manuscript: null as File | null,
    coverImage: null as File | null,
    synopsis: null as File | null,
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const router = useRouter()
  const { toast } = useToast()

  const handleInputChange = (field: string, value: string | boolean | File | null) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: "" }))
    }
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.title.trim()) {
      newErrors.title = "Title is required"
    }

    if (!formData.description.trim()) {
      newErrors.description = "Description is required"
    }

    if (!formData.category) {
      newErrors.category = "Category is required"
    }

    if (!formData.genre) {
      newErrors.genre = "Genre is required"
    }

    if (!formData.wordCount || parseInt(formData.wordCount) < 1000) {
      newErrors.wordCount = "Word count must be at least 1,000"
    }

    if (!formData.manuscript) {
      newErrors.manuscript = "Manuscript file is required"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      showErrorToast("Validation Error", "Please fix the errors in the form before submitting.")
      return
    }

    setIsSubmitting(true)

    try {
      const formDataToSend = new FormData()
      
      // Append text fields
      Object.entries(formData).forEach(([key, value]) => {
        if (value !== null && typeof value !== 'object') {
          formDataToSend.append(key, value.toString())
        }
      })

      // Append files
      if (formData.manuscript) {
        formDataToSend.append('manuscript', formData.manuscript)
      }
      if (formData.coverImage) {
        formDataToSend.append('coverImage', formData.coverImage)
      }

      const response = await fetch('/api/publishing/submissions', {
        method: 'POST',
        body: formDataToSend,
      })

      const result = await response.json()

      if (response.ok) {
        showSuccessToast(
          "Manuscript submitted successfully!",
          "Your manuscript has been submitted for review. You'll receive an email confirmation shortly."
        )
        
        // Reset form
        setFormData({
          title: "",
          description: "",
          category: "",
          genre: "",
          wordCount: "",
          language: "english",
          previouslyPublished: false,
          manuscript: null,
          coverImage: null,
        })

        // Navigate to success page
        setTimeout(() => {
          router.push('/success/submission')
        }, 2000)

        onSuccess?.()
      } else {
        const errorMessage = result.error || "Failed to submit manuscript"
        showErrorToast("Submission Failed", errorMessage)
        onError?.(errorMessage)
      }
    } catch (error) {
      console.error('Submission error:', error)
      const errorMessage = "An unexpected error occurred. Please try again."
      showErrorToast("Error", errorMessage)
      onError?.(errorMessage)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Submit Your Manuscript
        </CardTitle>
        <CardDescription>
          Share your work with us. Fill out the form below to submit your manuscript for review.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => handleInputChange("title", e.target.value)}
              placeholder="Enter your manuscript title"
              className={errors.title ? "border-destructive" : ""}
            />
            {errors.title && (
              <p className="text-sm text-destructive flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                {errors.title}
              </p>
            )}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange("description", e.target.value)}
              placeholder="Provide a brief description of your manuscript"
              rows={4}
              className={errors.description ? "border-destructive" : ""}
            />
            {errors.description && (
              <p className="text-sm text-destructive flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                {errors.description}
              </p>
            )}
          </div>

          {/* Category and Genre */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="category">Category *</Label>
              <Select value={formData.category} onValueChange={(value) => handleInputChange("category", value)}>
                <SelectTrigger className={errors.category ? "border-destructive" : ""}>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="fiction">Fiction</SelectItem>
                  <SelectItem value="non-fiction">Non-Fiction</SelectItem>
                  <SelectItem value="poetry">Poetry</SelectItem>
                  <SelectItem value="children">Children's Books</SelectItem>
                  <SelectItem value="young-adult">Young Adult</SelectItem>
                </SelectContent>
              </Select>
              {errors.category && (
                <p className="text-sm text-destructive flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {errors.category}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="genre">Genre *</Label>
              <Select value={formData.genre} onValueChange={(value) => handleInputChange("genre", value)}>
                <SelectTrigger className={errors.genre ? "border-destructive" : ""}>
                  <SelectValue placeholder="Select genre" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="literary-fiction">Literary Fiction</SelectItem>
                  <SelectItem value="romance">Romance</SelectItem>
                  <SelectItem value="thriller">Thriller/Mystery</SelectItem>
                  <SelectItem value="fantasy">Fantasy</SelectItem>
                  <SelectItem value="science-fiction">Science Fiction</SelectItem>
                  <SelectItem value="horror">Horror</SelectItem>
                  <SelectItem value="historical">Historical Fiction</SelectItem>
                  <SelectItem value="contemporary">Contemporary Fiction</SelectItem>
                  <SelectItem value="african-literature">African Literature</SelectItem>
                  <SelectItem value="magical-realism">Magical Realism</SelectItem>
                  <SelectItem value="crime">Crime/Detective</SelectItem>
                  <SelectItem value="dystopian">Dystopian</SelectItem>
                  <SelectItem value="memoir">Memoir/Biography</SelectItem>
                  <SelectItem value="self-help">Self-Help</SelectItem>
                  <SelectItem value="business">Business</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
              {errors.genre && (
                <p className="text-sm text-destructive flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {errors.genre}
                </p>
              )}
            </div>
          </div>

          {/* Word Count */}
          <div className="space-y-2">
            <Label htmlFor="wordCount">Word Count *</Label>
            <Input
              id="wordCount"
              type="number"
              value={formData.wordCount}
              onChange={(e) => handleInputChange("wordCount", e.target.value)}
              placeholder="Enter approximate word count"
              min="1000"
              className={errors.wordCount ? "border-destructive" : ""}
            />
            {errors.wordCount && (
              <p className="text-sm text-destructive flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                {errors.wordCount}
              </p>
            )}
          </div>

          {/* Language */}
          <div className="space-y-2">
            <Label htmlFor="language">Language</Label>
            <Select value={formData.language} onValueChange={(value) => handleInputChange("language", value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select language" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="english">English</SelectItem>
                <SelectItem value="yoruba">Yoruba</SelectItem>
                <SelectItem value="igbo">Igbo</SelectItem>
                <SelectItem value="hausa">Hausa</SelectItem>
                <SelectItem value="french">French</SelectItem>
                <SelectItem value="portuguese">Portuguese</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* File Uploads */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="manuscript">Manuscript File *</Label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                <Upload className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                <Input
                  id="manuscript"
                  type="file"
                  accept=".pdf,.doc,.docx"
                  onChange={(e) => handleInputChange("manuscript", e.target.files?.[0] || null)}
                  className="hidden"
                />
                <Label htmlFor="manuscript" className="cursor-pointer">
                  {formData.manuscript ? (
                    <span className="text-sm text-green-600">
                      {formData.manuscript.name}
                    </span>
                  ) : (
                    <span className="text-sm text-gray-500">
                      Click to upload manuscript (.pdf, .doc, .docx)
                    </span>
                  )}
                </Label>
              </div>
              {errors.manuscript && (
                <p className="text-sm text-destructive flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {errors.manuscript}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="coverImage">Cover Image (Optional)</Label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                <Upload className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                <Input
                  id="coverImage"
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleInputChange("coverImage", e.target.files?.[0] || null)}
                  className="hidden"
                />
                <Label htmlFor="coverImage" className="cursor-pointer">
                  {formData.coverImage ? (
                    <span className="text-sm text-green-600">
                      {formData.coverImage.name}
                    </span>
                  ) : (
                    <span className="text-sm text-gray-500">
                      Click to upload cover image
                    </span>
                  )}
                </Label>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <Button 
            type="submit" 
            className="w-full" 
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                <FileText className="mr-2 h-4 w-4" />
                Submit Manuscript
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
