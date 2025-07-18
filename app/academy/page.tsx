"use client"

import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle, ChevronRight, GraduationCap } from "lucide-react"

export default function AcademyPage() {
  const router = useRouter()
  const { data: session } = useSession()

  const features = [
    "Expert-led workshops",
    "Personalized feedback",
    "Publishing guidance",
    "Networking opportunities",
    "Access to writing resources",
    "Mentorship program",
  ]

  const handleEnrollClick = () => {
    if (!session) {
      router.push('/auth/signin?callbackUrl=/academy/courses')
    } else {
      router.push('/academy/courses')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <header className="bg-white dark:bg-gray-900 shadow-md">
        <div className="container py-4 px-4 sm:py-6 sm:px-6">
          <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-center bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-pink-600">
            DIFY Writing Academy
          </h1>
        </div>
      </header>

      <main className="container py-8 px-4 sm:py-12 sm:px-6">
        <div className="grid gap-8 sm:gap-12 lg:grid-cols-2 lg:items-center">
          <div className="space-y-4 sm:space-y-6">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold leading-tight">Transform Your Writing Career</h2>
            <p className="text-base sm:text-lg lg:text-xl text-gray-600 dark:text-gray-300 leading-relaxed">
              Join our comprehensive program designed to take you from idea to bestseller. Whether you're a beginner or
              an experienced writer, DIFY Academy has the tools and resources to elevate your craft.
            </p>
            <ul className="space-y-2 sm:space-y-3">
              {features.map((feature, index) => (
                <li key={index} className="flex items-center gap-2 sm:gap-3">
                  <CheckCircle className="text-green-500 flex-shrink-0 w-4 h-4 sm:w-5 sm:h-5" />
                  <span className="text-sm sm:text-base">{feature}</span>
                </li>
              ))}
            </ul>
            <Button
              size="lg"
              className="w-full sm:w-auto bg-purple-600 text-white hover:bg-purple-700 dark:bg-purple-700 dark:hover:bg-purple-600 text-base sm:text-lg px-6 py-3 sm:px-8 sm:py-4"
              onClick={handleEnrollClick}
            >
              Enroll Now
              <ChevronRight className="ml-2 h-4 w-4 sm:h-5 sm:w-5" />
            </Button>
          </div>
          <div className="relative h-[300px] sm:h-[400px] lg:h-auto rounded-xl overflow-hidden shadow-2xl order-first lg:order-last">
            <Image
              src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/482383392_656367003713839_4928841102980796470_n.jpg-XPkBOOhRPy8YbiFMtulZhFuVq9v9u1.jpeg"
              alt="DIFY Writing Academy"
              layout="fill"
              objectFit="cover"
            />
          </div>
        </div>

        <div className="mt-12 sm:mt-16 lg:mt-20">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-center mb-8 sm:mb-12">What You'll Learn</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
            {[
              {
                title: "Craft Compelling Stories",
                description: "Learn the art of storytelling and character development",
              },
              {
                title: "Master Writing Techniques",
                description: "Improve your writing style, grammar, and vocabulary",
              },
              {
                title: "Navigate the Publishing World",
                description: "Understand the ins and outs of getting your work published",
              },
              {
                title: "Build Your Author Platform",
                description: "Create a strong online presence and connect with readers",
              },
              {
                title: "Marketing Your Book",
                description: "Learn effective strategies to promote your published work",
              },
              { title: "Writing as a Career", description: "Turn your passion into a sustainable writing career" },
            ].map((module, index) => (
              <Card
                key={index}
                className="bg-white dark:bg-gray-800 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 sm:hover:-translate-y-2"
              >
                <CardHeader className="pb-3 sm:pb-4">
                  <CardTitle className="flex items-center gap-2 text-lg sm:text-xl font-semibold text-purple-600 dark:text-purple-400">
                    <GraduationCap className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
                    <span className="leading-tight">{module.title}</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <CardDescription className="text-sm sm:text-base leading-relaxed">{module.description}</CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}

