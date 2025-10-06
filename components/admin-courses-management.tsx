'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { GraduationCap, Search, Plus, MoreHorizontal, Eye, Edit, Trash2, CheckCircle, XCircle, Users, Clock, Star } from 'lucide-react'

interface Course {
  id: string
  title: string
  description: string | null
  price: string
  thumbnailImage: string | null
  instructorId: string
  isPublished: boolean
  duration: number | null
  level: string | null
  createdAt: string
  updatedAt: string
  instructor: {
    name: string | null
    email: string | null
  } | null
  moduleCount: number
  enrollmentCount: number
  averageRating: number | null
  reviewCount: number
  completionRate: number | null
}

export default function AdminCoursesManagement() {
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [publishedFilter, setPublishedFilter] = useState('all')
  const [levelFilter, setLevelFilter] = useState('all')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null)

  const fetchCourses = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '10',
        search: searchTerm,
        published: publishedFilter === 'all' ? '' : publishedFilter,
        level: levelFilter === 'all' ? '' : levelFilter
      })

      const response = await fetch(`/api/admin/courses?${params}`)
      const result = await response.json()

      if (result.success) {
        setCourses(result.data.courses)
        setTotalPages(result.data.pagination.pages)
      }
    } catch (error) {
      console.error('Error fetching courses:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCourses()
  }, [page, searchTerm, publishedFilter, levelFilter])

  const handleStatusChange = async (courseId: string, action: string) => {
    try {
      const response = await fetch('/api/admin/courses', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: courseId, action })
      })

      const result = await response.json()
      if (result.success) {
        fetchCourses() // Refresh the list
      }
    } catch (error) {
      console.error('Error updating course:', error)
    }
  }

  const handleDelete = async (courseId: string) => {
    if (!confirm('Are you sure you want to delete this course?')) return

    try {
      const response = await fetch(`/api/admin/courses?id=${courseId}`, {
        method: 'DELETE'
      })

      const result = await response.json()
      if (result.success) {
        fetchCourses() // Refresh the list
      } else {
        alert(result.error || 'Failed to delete course')
      }
    } catch (error) {
      console.error('Error deleting course:', error)
    }
  }

  const getLevelBadge = (level: string | null) => {
    const levelConfig = {
      beginner: { variant: 'secondary' as const, label: 'Beginner' },
      intermediate: { variant: 'default' as const, label: 'Intermediate' },
      advanced: { variant: 'destructive' as const, label: 'Advanced' }
    }

    if (!level) return <Badge variant="outline">No Level</Badge>
    
    const config = levelConfig[level as keyof typeof levelConfig] || levelConfig.beginner
    return <Badge variant={config.variant}>{config.label}</Badge>
  }

  const formatDuration = (minutes: number | null) => {
    if (!minutes) return 'Not set'
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="flex items-center gap-2">
                <GraduationCap className="h-5 w-5" />
                Courses Management
              </CardTitle>
              <CardDescription>
                Manage academy courses, modules, and student progress
              </CardDescription>
            </div>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Course
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filters */}
          <div className="flex gap-4 items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search courses by title or description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={publishedFilter} onValueChange={setPublishedFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Courses</SelectItem>
                <SelectItem value="true">Published</SelectItem>
                <SelectItem value="false">Draft</SelectItem>
              </SelectContent>
            </Select>
            <Select value={levelFilter} onValueChange={setLevelFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Levels</SelectItem>
                <SelectItem value="beginner">Beginner</SelectItem>
                <SelectItem value="intermediate">Intermediate</SelectItem>
                <SelectItem value="advanced">Advanced</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Courses Table */}
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Course</TableHead>
                  <TableHead>Instructor</TableHead>
                  <TableHead>Level</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Students</TableHead>
                  <TableHead>Rating</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8">
                      Loading courses...
                    </TableCell>
                  </TableRow>
                ) : courses.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8">
                      No courses found
                    </TableCell>
                  </TableRow>
                ) : (
                  courses.map((course) => (
                    <TableRow key={course.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          {course.thumbnailImage ? (
                            <img
                              src={course.thumbnailImage}
                              alt={course.title}
                              className="w-12 h-8 object-cover rounded"
                            />
                          ) : (
                            <div className="w-12 h-8 bg-gray-200 rounded flex items-center justify-center">
                              <GraduationCap className="h-4 w-4 text-gray-400" />
                            </div>
                          )}
                          <div>
                            <div className="font-medium">{course.title}</div>
                            <div className="text-sm text-gray-500 flex items-center gap-2">
                              <Clock className="h-3 w-3" />
                              {formatDuration(course.duration)}
                              <span>•</span>
                              {course.moduleCount} modules
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">
                            {course.instructor?.name || 'Unknown'}
                          </div>
                          <div className="text-sm text-gray-500">
                            {course.instructor?.email}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {getLevelBadge(course.level)}
                      </TableCell>
                      <TableCell>
                        ₦{parseFloat(course.price).toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          {course.enrollmentCount}
                        </div>
                      </TableCell>
                      <TableCell>
                        {course.averageRating ? (
                          <div className="flex items-center gap-1">
                            <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                            {course.averageRating} ({course.reviewCount})
                          </div>
                        ) : (
                          <span className="text-gray-400">No ratings</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant={course.isPublished ? 'default' : 'secondary'}>
                          {course.isPublished ? 'Published' : 'Draft'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => setSelectedCourse(course)}>
                              <Eye className="h-4 w-4 mr-2" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Edit className="h-4 w-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            {course.isPublished ? (
                              <DropdownMenuItem
                                onClick={() => handleStatusChange(course.id, 'unpublish')}
                              >
                                <XCircle className="h-4 w-4 mr-2" />
                                Unpublish
                              </DropdownMenuItem>
                            ) : (
                              <DropdownMenuItem
                                onClick={() => handleStatusChange(course.id, 'publish')}
                              >
                                <CheckCircle className="h-4 w-4 mr-2" />
                                Publish
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem
                              onClick={() => handleDelete(course.id)}
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

      {/* Course Details Dialog */}
      <Dialog open={!!selectedCourse} onOpenChange={() => setSelectedCourse(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{selectedCourse?.title}</DialogTitle>
            <DialogDescription>Course details and statistics</DialogDescription>
          </DialogHeader>
          {selectedCourse && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium mb-2">Basic Information</h4>
                  <div className="space-y-2 text-sm">
                    <div><strong>Instructor:</strong> {selectedCourse.instructor?.name || 'Unknown'}</div>
                    <div><strong>Level:</strong> {selectedCourse.level || 'Not set'}</div>
                    <div><strong>Duration:</strong> {formatDuration(selectedCourse.duration)}</div>
                    <div><strong>Price:</strong> ₦{parseFloat(selectedCourse.price).toLocaleString()}</div>
                    <div><strong>Modules:</strong> {selectedCourse.moduleCount}</div>
                    <div><strong>Status:</strong> {selectedCourse.isPublished ? 'Published' : 'Draft'}</div>
                  </div>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Performance</h4>
                  <div className="space-y-2 text-sm">
                    <div><strong>Enrollments:</strong> {selectedCourse.enrollmentCount}</div>
                    <div><strong>Reviews:</strong> {selectedCourse.reviewCount}</div>
                    <div><strong>Rating:</strong> {selectedCourse.averageRating || 'No ratings'}</div>
                    <div><strong>Completion Rate:</strong> {selectedCourse.completionRate ? `${selectedCourse.completionRate}%` : 'No data'}</div>
                  </div>
                </div>
              </div>
              <div>
                <h4 className="font-medium mb-2">Description</h4>
                <p className="text-sm text-gray-600">{selectedCourse.description || 'No description available'}</p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
