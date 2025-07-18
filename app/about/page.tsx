import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { BookOpen, Pen, GraduationCap, ArrowRight } from "lucide-react"
import Link from "next/link"

export default function AboutPage() {
  return (
    <div className="bg-gradient-to-b from-purple-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <header className="bg-white dark:bg-gray-900 shadow-md">
        <div className="container py-6 px-4 sm:py-8 sm:px-6">
          <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-center bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-pink-600">
            About EdifyPub
          </h1>
        </div>
      </header>

      <main className="container py-8 px-4 sm:py-12 sm:px-6">
        <div className="flex flex-col lg:flex-row items-center lg:items-start gap-8 sm:gap-12">
          <div className="w-full max-w-sm lg:w-1/3 lg:max-w-none">
            <div className="relative w-64 h-64 sm:w-80 sm:h-80 lg:w-full lg:h-96 mx-auto rounded-lg overflow-hidden shadow-2xl">
              <Image
                src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/482383392_656367003713839_4928841102980796470_n.jpg-XPkBOOhRPy8YbiFMtulZhFuVq9v9u1.jpeg"
                alt="EdifyPub Team"
                layout="fill"
                objectFit="cover"
              />
            </div>
          </div>
          <div className="w-full lg:w-2/3">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-4 sm:mb-6 text-purple-600 dark:text-purple-400 text-center lg:text-left">
              Empowering Writers, Inspiring Stories
            </h2>
            <p className="text-base sm:text-lg mb-4 sm:mb-6 text-gray-700 dark:text-gray-300 leading-relaxed">
              EdifyPub is a premier digital publishing platform dedicated to empowering writers and connecting readers with inspiring stories. With our comprehensive suite of publishing services, educational resources, and vibrant community, we help authors at every stage of their journey.
            </p>
            <p className="text-base sm:text-lg mb-4 sm:mb-6 text-gray-700 dark:text-gray-300 leading-relaxed">
              Our passion for storytelling and commitment to nurturing new talent has made us a trusted name in the digital publishing world. Through our platform, workshops, and online courses, we share expertise and inspire writers to find their unique voice and create impactful stories.
            </p>
            <h3 className="text-xl sm:text-2xl font-semibold mb-3 sm:mb-4 text-purple-600 dark:text-purple-400 text-center lg:text-left">EdifyPub's Mission</h3>
            <p className="text-base sm:text-lg mb-4 sm:mb-6 text-gray-700 dark:text-gray-300 leading-relaxed">
              To empower writers with the tools, knowledge, and confidence they need to share their stories with the world, fostering a vibrant community of diverse voices and perspectives through innovative digital publishing solutions.
            </p>
          </div>
        </div>

        <section className="mt-12 sm:mt-16">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-center mb-6 sm:mb-8 bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-pink-600">
            Victoria's Journey
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
            <Card className="text-center sm:text-left">
              <CardHeader className="pb-3 sm:pb-4">
                <CardTitle className="flex items-center justify-center sm:justify-start gap-2 text-lg sm:text-xl">
                  <BookOpen className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600 flex-shrink-0" />
                  <span>Bestselling Author</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-sm sm:text-base leading-relaxed">Author of multiple bestselling books, including "Letter to My Sister" and "In Two Weeks".</p>
              </CardContent>
            </Card>
            <Card className="text-center sm:text-left">
              <CardHeader className="pb-3 sm:pb-4">
                <CardTitle className="flex items-center justify-center sm:justify-start gap-2 text-lg sm:text-xl">
                  <Pen className="w-5 h-5 sm:w-6 sm:h-6 text-pink-600 flex-shrink-0" />
                  <span>Writing Coach</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-sm sm:text-base leading-relaxed">Experienced writing coach who has mentored hundreds of aspiring authors to success.</p>
              </CardContent>
            </Card>
            <Card className="text-center sm:text-left sm:col-span-2 lg:col-span-1">
              <CardHeader className="pb-3 sm:pb-4">
                <CardTitle className="flex items-center justify-center sm:justify-start gap-2 text-lg sm:text-xl">
                  <GraduationCap className="w-5 h-5 sm:w-6 sm:h-6 text-indigo-600 flex-shrink-0" />
                  <span>Founder of DIFY Academy</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-sm sm:text-base leading-relaxed">Created the DIFY Writing Academy to provide comprehensive writing education and support.</p>
              </CardContent>
            </Card>
          </div>
        </section>

        <section className="mt-12 sm:mt-16 text-center">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-4 sm:mb-6 bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-pink-600">
            Ready to Start Your Writing Journey?
          </h2>
          <p className="text-base sm:text-lg mb-6 sm:mb-8 max-w-2xl mx-auto text-gray-700 dark:text-gray-300 px-4 leading-relaxed">
            Join Victoria's community of writers and take the first step towards realizing your writing dreams.
          </p>
          <Button
            asChild
            className="bg-purple-600 text-white hover:bg-purple-700 dark:bg-purple-700 dark:hover:bg-purple-600 text-sm sm:text-base px-6 py-2 sm:px-8 sm:py-3"
          >
            <Link href="/academy">
              Join DIFY Academy <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </section>
      </main>
    </div>
  )
}

