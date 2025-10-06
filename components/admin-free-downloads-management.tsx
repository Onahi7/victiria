'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Download, Search, MoreHorizontal, Eye, Mail, Users, BookOpen, Calendar, TrendingUp, UserPlus } from 'lucide-react'
import { toast } from '@/hooks/use-toast'

interface FreeDownload {
  id: string
  userId: string
  bookId: string
  bookTitle: string
  bookAuthor: string
  userName: string
  userEmail: string
  userPhone: string
  downloadedAt: string
  ipAddress?: string
  userAgent?: string
}

interface Subscriber {
  id: string
  email: string
  name: string
  phone?: string
  source: string // 'free_download', 'newsletter', 'manual'
  isActive: boolean
  subscribedAt: string
  lastActivity?: string
}

interface FreeDownloadStats {
  totalDownloads: number
  uniqueUsers: number
  totalBooks: number
  recentDownloads: number
  newSubscribers: number
  topBooks: Array<{
    bookId: string
    title: string
    author: string
    downloads: number
  }>
}

export default function AdminFreeDownloadsManagement() {
  const [downloads, setDownloads] = useState<FreeDownload[]>([])
  const [subscribers, setSubscribers] = useState<Subscriber[]>([])
  const [stats, setStats] = useState<FreeDownloadStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [dateFilter, setDateFilter] = useState('all')
  const [bookFilter, setBookFilter] = useState('all')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [selectedDownload, setSelectedDownload] = useState<FreeDownload | null>(null)
  const [activeTab, setActiveTab] = useState('downloads')

  const fetchDownloads = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '10',
        search: searchTerm,
        dateFilter,
        bookFilter
      })

      const response = await fetch(`/api/admin/free-downloads?${params}`)
      const result = await response.json()

      if (result.success) {
        setDownloads(result.data.downloads)
        setTotalPages(result.data.pagination.pages)
      }
    } catch (error) {
      console.error('Error fetching downloads:', error)
      toast({
        title: "Error",
        description: "Failed to fetch download data",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchSubscribers = async () => {
    try {
      const response = await fetch('/api/admin/subscribers')
      const result = await response.json()

      if (result.success) {
        setSubscribers(result.data.subscribers)
      }
    } catch (error) {
      console.error('Error fetching subscribers:', error)
    }
  }

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/admin/free-downloads/stats')
      const result = await response.json()

      if (result.success) {
        setStats(result.data)
      }
    } catch (error) {
      console.error('Error fetching stats:', error)
    }
  }

  useEffect(() => {
    fetchDownloads()
    fetchSubscribers()
    fetchStats()
  }, [page, searchTerm, dateFilter, bookFilter])

  const handleAddToNewsletter = async (email: string, name: string) => {
    try {
      const response = await fetch('/api/admin/subscribers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          name,
          source: 'free_download'
        })
      })

      const result = await response.json()
      if (result.success) {
        toast({
          title: "Success",
          description: "User added to newsletter subscribers",
        })
        fetchSubscribers()
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to add subscriber",
          variant: "destructive"
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add subscriber",
        variant: "destructive"
      })
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const isSubscriber = (email: string) => {
    return subscribers.some(sub => sub.email === email && sub.isActive)
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Download className="h-8 w-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">Total Downloads</p>
                  <p className="text-2xl font-bold">{stats.totalDownloads}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Users className="h-8 w-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">Unique Users</p>
                  <p className="text-2xl font-bold">{stats.uniqueUsers}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <BookOpen className="h-8 w-8 text-purple-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">Free Books</p>
                  <p className="text-2xl font-bold">{stats.totalBooks}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Mail className="h-8 w-8 text-orange-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">New Subscribers</p>
                  <p className="text-2xl font-bold">{stats.newSubscribers}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="downloads">Download History</TabsTrigger>
          <TabsTrigger value="subscribers">Subscribers</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="downloads">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Download className="h-5 w-5" />
                    Free Book Downloads
                  </CardTitle>
                  <CardDescription>
                    Track and manage free book downloads and user information
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Filters */}
              <div className="flex gap-4 items-center">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search by user name, email, or book title..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                
                <Select value={dateFilter} onValueChange={setDateFilter}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Filter by date" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Time</SelectItem>
                    <SelectItem value="today">Today</SelectItem>
                    <SelectItem value="week">This Week</SelectItem>
                    <SelectItem value="month">This Month</SelectItem>
                    <SelectItem value="quarter">This Quarter</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={bookFilter} onValueChange={setBookFilter}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Filter by book" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Books</SelectItem>
                    {stats?.topBooks.map((book) => (
                      <SelectItem key={book.bookId} value={book.bookId}>
                        {book.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Downloads Table */}
              <div className="border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User Details</TableHead>
                      <TableHead>Book</TableHead>
                      <TableHead>Download Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8">
                          Loading downloads...
                        </TableCell>
                      </TableRow>
                    ) : downloads.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8">
                          No downloads found
                        </TableCell>
                      </TableRow>
                    ) : (
                      downloads.map((download) => (
                        <TableRow key={download.id}>
                          <TableCell>
                            <div>
                              <div className="font-medium">{download.userName}</div>
                              <div className="text-sm text-gray-500">{download.userEmail}</div>
                              {download.userPhone && (
                                <div className="text-sm text-gray-500">{download.userPhone}</div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div>
                              <div className="font-medium">{download.bookTitle}</div>
                              <div className="text-sm text-gray-500">by {download.bookAuthor}</div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {formatDate(download.downloadedAt)}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Badge variant="default">Downloaded</Badge>
                              {isSubscriber(download.userEmail) ? (
                                <Badge variant="secondary">Subscribed</Badge>
                              ) : (
                                <Badge variant="outline">Not Subscribed</Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="h-8 w-8 p-0">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => setSelectedDownload(download)}>
                                  <Eye className="h-4 w-4 mr-2" />
                                  View Details
                                </DropdownMenuItem>
                                {!isSubscriber(download.userEmail) && (
                                  <DropdownMenuItem 
                                    onClick={() => handleAddToNewsletter(download.userEmail, download.userName)}
                                  >
                                    <UserPlus className="h-4 w-4 mr-2" />
                                    Add to Newsletter
                                  </DropdownMenuItem>
                                )}
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
        </TabsContent>

        <TabsContent value="subscribers">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Newsletter Subscribers
              </CardTitle>
              <CardDescription>
                Manage subscribers from free book downloads
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Subscriber</TableHead>
                      <TableHead>Source</TableHead>
                      <TableHead>Subscribed Date</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {subscribers.filter(sub => sub.source === 'free_download').map((subscriber) => (
                      <TableRow key={subscriber.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{subscriber.name}</div>
                            <div className="text-sm text-gray-500">{subscriber.email}</div>
                            {subscriber.phone && (
                              <div className="text-sm text-gray-500">{subscriber.phone}</div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">Free Download</Badge>
                        </TableCell>
                        <TableCell>{formatDate(subscriber.subscribedAt)}</TableCell>
                        <TableCell>
                          <Badge variant={subscriber.isActive ? "default" : "destructive"}>
                            {subscriber.isActive ? "Active" : "Inactive"}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top Downloaded Books */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Most Downloaded Books
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {stats?.topBooks.map((book, index) => (
                    <div key={book.bookId} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center">
                          <span className="text-sm font-medium text-purple-600">#{index + 1}</span>
                        </div>
                        <div>
                          <div className="font-medium">{book.title}</div>
                          <div className="text-sm text-gray-500">by {book.author}</div>
                        </div>
                      </div>
                      <Badge variant="secondary">{book.downloads} downloads</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Download Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {downloads.slice(0, 5).map((download) => (
                    <div key={download.id} className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full bg-green-500"></div>
                      <div className="flex-1">
                        <div className="text-sm">
                          <span className="font-medium">{download.userName}</span> downloaded{' '}
                          <span className="font-medium">{download.bookTitle}</span>
                        </div>
                        <div className="text-xs text-gray-500">{formatDate(download.downloadedAt)}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Download Details Modal */}
      <Dialog open={!!selectedDownload} onOpenChange={() => setSelectedDownload(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Download Details</DialogTitle>
            <DialogDescription>Complete information about this free book download</DialogDescription>
          </DialogHeader>
          {selectedDownload && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium mb-2">User Information</h4>
                  <div className="space-y-2 text-sm">
                    <div><strong>Name:</strong> {selectedDownload.userName}</div>
                    <div><strong>Email:</strong> {selectedDownload.userEmail}</div>
                    <div><strong>Phone:</strong> {selectedDownload.userPhone || 'Not provided'}</div>
                    <div><strong>Newsletter Status:</strong> {
                      isSubscriber(selectedDownload.userEmail) ? 
                        <Badge variant="default">Subscribed</Badge> : 
                        <Badge variant="outline">Not Subscribed</Badge>
                    }</div>
                  </div>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Download Information</h4>
                  <div className="space-y-2 text-sm">
                    <div><strong>Book:</strong> {selectedDownload.bookTitle}</div>
                    <div><strong>Author:</strong> {selectedDownload.bookAuthor}</div>
                    <div><strong>Downloaded:</strong> {formatDate(selectedDownload.downloadedAt)}</div>
                    <div><strong>IP Address:</strong> {selectedDownload.ipAddress || 'Not tracked'}</div>
                  </div>
                </div>
              </div>
              
              {!isSubscriber(selectedDownload.userEmail) && (
                <div className="flex justify-end pt-4 border-t">
                  <Button 
                    onClick={() => {
                      handleAddToNewsletter(selectedDownload.userEmail, selectedDownload.userName)
                      setSelectedDownload(null)
                    }}
                  >
                    <UserPlus className="h-4 w-4 mr-2" />
                    Add to Newsletter
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
