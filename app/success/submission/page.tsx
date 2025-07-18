import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, FileText, Clock, ArrowRight } from "lucide-react"
import Link from "next/link"

export default function SubmissionSuccessPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 via-white to-green-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 py-8">
      <div className="container max-w-2xl mx-auto px-4">
        {/* Success Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-green-800 dark:text-green-200 mb-2">
            Submission Successful!
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Your manuscript has been submitted for review.
          </p>
        </div>

        {/* Submission Details */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg sm:text-xl">Submission Details</CardTitle>
            <CardDescription>Your submission information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Submission ID:</span>
              <Badge variant="secondary">#SUB-2024-001</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Status:</span>
              <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                <Clock className="w-3 h-3 mr-1" />
                Under Review
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Submitted:</span>
              <span className="text-sm">{new Date().toLocaleDateString()}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Category:</span>
              <Badge variant="outline">Fiction</Badge>
            </div>
          </CardContent>
        </Card>

        {/* Review Process */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg sm:text-xl">Review Process</CardTitle>
            <CardDescription>What happens next</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center flex-shrink-0">
                <FileText className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h4 className="font-medium">Initial Review</h4>
                <p className="text-sm text-muted-foreground">
                  Our editorial team will review your submission within 5-7 business days
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center flex-shrink-0">
                <Clock className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <h4 className="font-medium">Feedback & Decision</h4>
                <p className="text-sm text-muted-foreground">
                  You'll receive detailed feedback and our publishing decision via email
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tips for Authors */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg sm:text-xl">Tips for Authors</CardTitle>
            <CardDescription>While you wait</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
              <span className="text-sm">Continue writing your next manuscript</span>
            </div>
            <div className="flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
              <span className="text-sm">Join our author community for support</span>
            </div>
            <div className="flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
              <span className="text-sm">Read our publishing guidelines</span>
            </div>
            <div className="flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
              <span className="text-sm">Check your email regularly for updates</span>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
          <Button className="flex-1" asChild>
            <Link href="/publishing/submissions">
              <FileText className="w-4 h-4 mr-2" />
              Track Submission
            </Link>
          </Button>
          <Button variant="outline" className="flex-1" asChild>
            <Link href="/publishing">
              Submit Another
            </Link>
          </Button>
        </div>

        {/* Continue Exploring */}
        <div className="text-center mt-8 pt-6 border-t">
          <p className="text-sm text-muted-foreground mb-4">
            Want to learn more about publishing?
          </p>
          <Button variant="ghost" asChild>
            <Link href="/blog">
              Read Publishing Tips
              <ArrowRight className="w-4 h-4 ml-2" />
            </Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
