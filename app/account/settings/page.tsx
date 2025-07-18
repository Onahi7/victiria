import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { 
  User, 
  Bell, 
  Shield, 
  CreditCard, 
  Globe, 
  Eye, 
  Mail, 
  Smartphone, 
  Download,
  Trash2,
  AlertTriangle
} from "lucide-react"

export default function AccountSettingsPage() {
  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="text-center sm:text-left">
        <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight">Account Settings</h1>
        <p className="text-xs sm:text-sm lg:text-base text-muted-foreground mt-1 sm:mt-2">
          Manage your account preferences and settings
        </p>
      </div>

      {/* Profile Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg sm:text-xl flex items-center gap-2">
            <User className="h-4 w-4 sm:h-5 sm:w-5" />
            Profile Information
          </CardTitle>
          <CardDescription className="text-sm sm:text-base">
            Update your personal information and profile details
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="firstName" className="text-sm sm:text-base">First Name</Label>
              <Input id="firstName" placeholder="Your first name" className="text-sm sm:text-base" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName" className="text-sm sm:text-base">Last Name</Label>
              <Input id="lastName" placeholder="Your last name" className="text-sm sm:text-base" />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm sm:text-base">Email Address</Label>
            <Input id="email" type="email" placeholder="your.email@example.com" className="text-sm sm:text-base" />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="bio" className="text-sm sm:text-base">Bio</Label>
            <Textarea id="bio" placeholder="Tell us about yourself..." className="text-sm sm:text-base" rows={3} />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="location" className="text-sm sm:text-base">Location</Label>
            <Input id="location" placeholder="Your location" className="text-sm sm:text-base" />
          </div>
          
          <Button className="text-sm sm:text-base">Save Profile Changes</Button>
        </CardContent>
      </Card>

      {/* Notification Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg sm:text-xl flex items-center gap-2">
            <Bell className="h-4 w-4 sm:h-5 sm:w-5" />
            Notification Preferences
          </CardTitle>
          <CardDescription className="text-sm sm:text-base">
            Choose how you want to be notified about updates and activities
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label className="text-sm sm:text-base">Email Notifications</Label>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  Receive notifications via email
                </p>
              </div>
              <Switch />
            </div>
            
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label className="text-sm sm:text-base">Push Notifications</Label>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  Receive push notifications in your browser
                </p>
              </div>
              <Switch />
            </div>
            
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label className="text-sm sm:text-base">Course Updates</Label>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  Get notified about new courses and updates
                </p>
              </div>
              <Switch />
            </div>
            
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label className="text-sm sm:text-base">Event Reminders</Label>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  Receive reminders for upcoming events
                </p>
              </div>
              <Switch />
            </div>
            
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label className="text-sm sm:text-base">Marketing Emails</Label>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  Receive promotional emails and newsletters
                </p>
              </div>
              <Switch />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Privacy Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg sm:text-xl flex items-center gap-2">
            <Shield className="h-4 w-4 sm:h-5 sm:w-5" />
            Privacy & Security
          </CardTitle>
          <CardDescription className="text-sm sm:text-base">
            Manage your privacy preferences and security settings
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label className="text-sm sm:text-base">Profile Visibility</Label>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  Make your profile visible to other users
                </p>
              </div>
              <Switch />
            </div>
            
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label className="text-sm sm:text-base">Show Reading Activity</Label>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  Share your reading progress with others
                </p>
              </div>
              <Switch />
            </div>
            
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label className="text-sm sm:text-base">Analytics & Tracking</Label>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  Help us improve by sharing usage data
                </p>
              </div>
              <Switch />
            </div>
          </div>
          
          <Separator />
          
          <div className="space-y-2">
            <Label className="text-sm sm:text-base">Change Password</Label>
            <div className="space-y-2">
              <Input type="password" placeholder="Current password" className="text-sm sm:text-base" />
              <Input type="password" placeholder="New password" className="text-sm sm:text-base" />
              <Input type="password" placeholder="Confirm new password" className="text-sm sm:text-base" />
            </div>
            <Button variant="outline" className="text-sm sm:text-base">Update Password</Button>
          </div>
        </CardContent>
      </Card>

      {/* Account Preferences */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg sm:text-xl flex items-center gap-2">
            <Globe className="h-4 w-4 sm:h-5 sm:w-5" />
            Account Preferences
          </CardTitle>
          <CardDescription className="text-sm sm:text-base">
            Customize your account settings and preferences
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 sm:gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <Label className="text-sm sm:text-base">Language</Label>
              <Select>
                <SelectTrigger className="text-sm sm:text-base">
                  <SelectValue placeholder="Select language" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="es">Spanish</SelectItem>
                  <SelectItem value="fr">French</SelectItem>
                  <SelectItem value="de">German</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label className="text-sm sm:text-base">Time Zone</Label>
              <Select>
                <SelectTrigger className="text-sm sm:text-base">
                  <SelectValue placeholder="Select time zone" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="est">Eastern Time</SelectItem>
                  <SelectItem value="pst">Pacific Time</SelectItem>
                  <SelectItem value="mst">Mountain Time</SelectItem>
                  <SelectItem value="cst">Central Time</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="space-y-2">
            <Label className="text-sm sm:text-base">Reading Preferences</Label>
            <Select>
              <SelectTrigger className="text-sm sm:text-base">
                <SelectValue placeholder="Select reading preference" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="fiction">Fiction</SelectItem>
                <SelectItem value="nonfiction">Non-fiction</SelectItem>
                <SelectItem value="both">Both</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Data Management */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg sm:text-xl flex items-center gap-2">
            <Download className="h-4 w-4 sm:h-5 sm:w-5" />
            Data Management
          </CardTitle>
          <CardDescription className="text-sm sm:text-base">
            Manage your data and account information
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2">
            <Button variant="outline" className="text-sm sm:text-base">
              <Download className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
              Download My Data
            </Button>
            <Button variant="outline" className="text-sm sm:text-base">
              <Eye className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
              View Activity Log
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="border-red-200 dark:border-red-800">
        <CardHeader>
          <CardTitle className="text-lg sm:text-xl flex items-center gap-2 text-red-600 dark:text-red-400">
            <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5" />
            Danger Zone
          </CardTitle>
          <CardDescription className="text-sm sm:text-base">
            Irreversible actions that will permanently affect your account
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label className="text-sm sm:text-base">Delete Account</Label>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Once you delete your account, there is no going back. Please be certain.
            </p>
            <Button variant="destructive" className="text-sm sm:text-base">
              <Trash2 className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
              Delete Account
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
