"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Gift, DollarSign } from "lucide-react"

export default function SimpleBookCreateForm() {
  const [isFree, setIsFree] = useState(false)
  const [title, setTitle] = useState("")
  const [author, setAuthor] = useState("")
  const [description, setDescription] = useState("")
  const [price, setPrice] = useState(0)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const bookData = {
        title,
        author,
        description,
        isFree,
        price: isFree ? 0 : price,
        category: "Fiction", // Default category
        status: "draft",
        language: "English"
      }

      const response = await fetch('/api/books', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(bookData),
      })

      const result = await response.json()

      if (response.ok) {
        alert('Book created successfully!')
        // Reset form
        setTitle("")
        setAuthor("")
        setDescription("")
        setIsFree(false)
        setPrice(0)
      } else {
        alert(`Error: ${result.error || 'Failed to create book'}`)
      }
    } catch (error) {
      console.error('Error:', error)
      alert('An error occurred while creating the book')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle>Create New Book - Simple Test</CardTitle>
          <CardDescription>Test the free/paid book functionality</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <Label htmlFor="title">Book Title</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter book title"
                required
              />
            </div>

            <div>
              <Label htmlFor="author">Author</Label>
              <Input
                id="author"
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
                placeholder="Enter author name"
                required
              />
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Enter book description (minimum 10 characters)"
                required
                rows={3}
              />
            </div>

            {/* Free/Paid Toggle */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {isFree ? <Gift className="h-5 w-5" /> : <DollarSign className="h-5 w-5" />}
                  Book Type
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="isFree"
                    checked={isFree}
                    onCheckedChange={setIsFree}
                  />
                  <Label htmlFor="isFree" className="flex items-center gap-2">
                    {isFree ? (
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

                {!isFree && (
                  <div className="mt-4">
                    <Label htmlFor="price">Price ($)</Label>
                    <Input
                      id="price"
                      type="number"
                      step="0.01"
                      min="0"
                      value={price}
                      onChange={(e) => setPrice(parseFloat(e.target.value) || 0)}
                      placeholder="0.00"
                    />
                  </div>
                )}
              </CardContent>
            </Card>

            <Button type="submit" disabled={loading} className="w-full">
              {loading ? "Creating Book..." : "Create Book"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
