import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { BookOpen, Pen, GraduationCap, ArrowRight, Sparkles, Upload, Star } from "lucide-react"
import EventsSection from "@/components/events-section"
import BlogSection from "@/components/blog-section"

export default function Home() {
  return (
    <div className="bg-gradient-to-b from-purple-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Hero Section */}
      <section className="py-12 md:py-20 lg:py-32 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900 dark:to-pink-900 opacity-50"></div>
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="flex flex-col lg:flex-row items-center gap-8 lg:gap-16">
            <div className="flex-1 text-center lg:text-left max-w-2xl lg:max-w-none">
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold mb-4 md:mb-6 lg:mb-8 bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-pink-600 animate-text leading-tight">
                Unleash Your Writing Potential
              </h1>
              <p className="text-base sm:text-lg md:text-xl lg:text-2xl mb-6 md:mb-8 lg:mb-10 text-gray-700 dark:text-gray-300 leading-relaxed">
                Join EdifyPub's vibrant community of writers. Discover your voice, perfect your craft, and share
                your stories with the world.
              </p>
              <div className="flex flex-col sm:flex-row justify-center lg:justify-start gap-4 lg:gap-6">
                <Button
                  asChild
                  size="lg"
                  className="bg-purple-600 text-white hover:bg-purple-700 dark:bg-purple-700 dark:hover:bg-purple-600 transform hover:scale-105 transition-all duration-200 text-sm md:text-base lg:text-lg px-6 md:px-8 py-3 md:py-4 h-auto"
                >
                  <Link href="/books">Explore Books</Link>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  size="lg"
                  className="border-purple-600 text-purple-600 hover:bg-purple-100 dark:border-purple-400 dark:text-purple-400 dark:hover:bg-purple-900 transform hover:scale-105 transition-all duration-200 text-sm md:text-base lg:text-lg px-6 md:px-8 py-3 md:py-4 h-auto"
                >
                  <Link href="/academy">Join DIFY Academy</Link>
                </Button>
              </div>
            </div>
            <div className="flex-shrink-0 flex justify-center lg:justify-end">
              <div className="relative w-48 h-48 sm:w-56 sm:h-56 md:w-72 md:h-72 lg:w-80 lg:h-80 xl:w-96 xl:h-96 rounded-full overflow-hidden shadow-2xl hover:shadow-3xl transition-shadow duration-300">
                <Image
                  src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/482383392_656367003713839_4928841102980796470_n.jpg-XPkBOOhRPy8YbiFMtulZhFuVq9v9u1.jpeg"
                  alt="EdifyPub"
                  fill
                  className="rounded-full object-cover"
                  priority
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section className="py-12 md:py-16 lg:py-20 bg-white dark:bg-gray-800">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-bold text-center mb-8 md:mb-12 lg:mb-16 bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-pink-600">
            Elevate Your Writing Journey
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
            {[
              { icon: BookOpen, title: "Bestselling Books", color: "purple", link: "/books", description: "Discover captivating stories and bestselling novels" },
              { icon: Pen, title: "Writing Services", color: "pink", link: "/services", description: "Professional editing and writing consultation" },
              { icon: GraduationCap, title: "DIFY Academy", color: "indigo", link: "/academy", description: "Learn from industry experts and master your craft" },
              { icon: Upload, title: "Publishing Platform", color: "blue", link: "/publishing", description: "Publish your work and reach global audiences" },
            ].map((item, index) => (
              <Card
                key={index}
                className="group hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 border-0 shadow-lg overflow-hidden"
              >
                <CardHeader className={`bg-gradient-to-br from-${item.color}-50 to-${item.color}-100 dark:from-${item.color}-900/50 dark:to-${item.color}-800/50 pb-4`}>
                  <CardTitle className={`flex items-center gap-3 text-lg md:text-xl lg:text-2xl font-semibold text-${item.color}-600 dark:text-${item.color}-400`}>
                    <item.icon className="w-6 h-6 lg:w-8 lg:h-8 group-hover:scale-110 transition-transform duration-200" />
                    <span className="leading-tight">{item.title}</span>
                  </CardTitle>
                  <p className="text-sm md:text-base text-gray-600 dark:text-gray-300 mt-2">
                    {item.description}
                  </p>
                </CardHeader>
                <CardContent className="pt-4 pb-6">
                  <Button
                    asChild
                    className={`w-full bg-${item.color}-600 text-white hover:bg-${item.color}-700 dark:bg-${item.color}-700 dark:hover:bg-${item.color}-600 transition-colors duration-200 text-sm md:text-base h-auto py-2 md:py-3`}
                  >
                    <Link href={item.link} className="flex items-center justify-center">
                      Learn More 
                      <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform duration-200" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Blog Section */}
      <BlogSection />

      {/* CTA Section */}
      <section className="py-12 md:py-16 lg:py-20 bg-gradient-to-br from-purple-600 to-pink-600 text-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-bold mb-4 md:mb-6 lg:mb-8">
            Ready to Write Your Success Story?
          </h2>
          <p className="text-lg md:text-xl lg:text-2xl mb-8 md:mb-10 lg:mb-12 max-w-4xl mx-auto leading-relaxed">
            Join our vibrant community of writers, publish your work, and turn your passion into a thriving career.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4 lg:gap-6 max-w-md sm:max-w-none mx-auto">
            <Button
              asChild
              size="lg"
              className="bg-white text-purple-600 hover:bg-purple-100 transform hover:scale-105 transition-all duration-200 text-sm md:text-base lg:text-lg px-6 md:px-8 py-3 md:py-4 h-auto"
            >
              <Link href="/get-started" className="flex items-center justify-center">
                Start Your Journey 
                <Sparkles className="ml-2 h-4 w-4 md:h-5 md:w-5" />
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="border-white text-white hover:bg-purple-700 hover:border-purple-300 transform hover:scale-105 transition-all duration-200 text-sm md:text-base lg:text-lg px-6 md:px-8 py-3 md:py-4 h-auto"
            >
              <Link href="/publishing" className="flex items-center justify-center">
                Publish Your Work 
                <Upload className="ml-2 h-4 w-4 md:h-5 md:w-5" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Events Section */}
      <EventsSection />

      {/* Testimonials Section */}
      <section className="py-12 md:py-16 lg:py-20 bg-gray-50 dark:bg-gray-800">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-bold text-center mb-8 md:mb-12 lg:mb-16 bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-pink-600">
            What Our Community Says
          </h2>
          <div className="max-w-4xl mx-auto">
            <Card className="text-center py-8 md:py-12 lg:py-16 shadow-lg">
              <CardContent>
                <div className="flex justify-center mb-6">
                  <div className="flex space-x-1">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-6 h-6 md:w-8 md:h-8 text-yellow-400 fill-current" />
                    ))}
                  </div>
                </div>
                <p className="text-lg md:text-xl lg:text-2xl text-gray-600 dark:text-gray-300 mb-6 md:mb-8 leading-relaxed">
                  "EdifyPub's platform and community have transformed my writing journey. The resources and professional support are unmatched."
                </p>
                <div className="text-gray-800 dark:text-gray-200">
                  <p className="font-semibold text-base md:text-lg">Featured Author</p>
                  <p className="text-sm md:text-base text-gray-600 dark:text-gray-400">Published Writer & Academy Graduate</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8 md:py-12 lg:py-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
            <div className="space-y-4">
              <h3 className="font-semibold text-lg md:text-xl mb-4">Quick Links</h3>
              <ul className="space-y-3">
                {["Books", "Services", "Academy", "Publishing", "About"].map((item) => (
                  <li key={item}>
                    <Link
                      href={`/${item.toLowerCase()}`}
                      className="hover:text-purple-400 transition-colors duration-200 text-sm md:text-base"
                    >
                      {item}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div className="space-y-4">
              <h3 className="font-semibold text-lg md:text-xl mb-4">Connect</h3>
              <ul className="space-y-3">
                {["Facebook", "Twitter", "Instagram", "LinkedIn"].map((social) => (
                  <li key={social}>
                    <a href="#" className="hover:text-purple-400 transition-colors duration-200 text-sm md:text-base">
                      {social}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
            <div className="space-y-4">
              <h3 className="font-semibold text-lg md:text-xl mb-4">Legal</h3>
              <ul className="space-y-3">
                <li>
                  <Link href="/privacy" className="hover:text-purple-400 transition-colors duration-200 text-sm md:text-base">
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link href="/terms" className="hover:text-purple-400 transition-colors duration-200 text-sm md:text-base">
                    Terms of Service
                  </Link>
                </li>
              </ul>
            </div>
            <div className="space-y-4">
              <h3 className="font-semibold text-lg md:text-xl mb-4">Newsletter</h3>
              <p className="mb-4 text-sm md:text-base text-gray-300">Stay updated with our latest news and offers.</p>
              <form className="flex flex-col sm:flex-row gap-2">
                <input
                  type="email"
                  placeholder="Enter your email"
                  className="flex-1 px-4 py-2 md:py-3 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-600 dark:bg-gray-700 text-sm md:text-base"
                />
                <Button
                  type="submit"
                  className="bg-purple-600 hover:bg-purple-700 transition-colors duration-200 px-4 py-2 md:py-3 text-sm md:text-base h-auto whitespace-nowrap"
                >
                  Subscribe
                </Button>
              </form>
            </div>
          </div>
          <div className="mt-8 md:mt-12 pt-6 md:pt-8 border-t border-gray-800 text-center">
            <p className="text-sm md:text-base text-gray-400">&copy; 2024 EdifyPub. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}

