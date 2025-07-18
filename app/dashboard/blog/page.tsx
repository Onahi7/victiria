import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CalendarDays, Edit, Eye, MessageSquare, Plus, Search, Trash2 } from "lucide-react"
import Image from "next/image"

export default function BlogDashboard() {
  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Blog Management</h2>
        <div className="flex items-center space-x-2">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            New Post
          </Button>
        </div>
      </div>
      <Tabs defaultValue="all" className="space-y-4">
        <div className="flex justify-between">
          <TabsList>
            <TabsTrigger value="all">All Posts</TabsTrigger>
            <TabsTrigger value="published">Published</TabsTrigger>
            <TabsTrigger value="drafts">Drafts</TabsTrigger>
            <TabsTrigger value="scheduled">Scheduled</TabsTrigger>
          </TabsList>
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input type="search" placeholder="Search posts..." className="w-[200px] pl-8 md:w-[300px]" />
          </div>
        </div>
        <TabsContent value="all" className="space-y-4">
          <div className="flex items-center justify-center h-40">
            <div className="text-center">
              <p className="text-muted-foreground mb-4">No blog posts yet</p>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Create your first post
              </Button>
            </div>
          </div>
        </TabsContent>
        <TabsContent value="published" className="space-y-4">
          <div className="flex items-center justify-center h-40">
            <p className="text-muted-foreground">No published posts</p>
          </div>
        </TabsContent>
        <TabsContent value="drafts" className="space-y-4">
          <div className="flex items-center justify-center h-40">
            <p className="text-muted-foreground">No draft posts</p>
          </div>
        </TabsContent>
        <TabsContent value="scheduled" className="space-y-4">
          <div className="flex items-center justify-center h-40">
            <p className="text-muted-foreground">No scheduled posts</p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

