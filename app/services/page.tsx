import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Pen, Sparkles, BookOpen, ArrowRight, Check } from "lucide-react"

export default function ServicesPage() {
  const services = [
    {
      title: "Proofreading",
      icon: Pen,
      description:
        "Polish your manuscript with expert proofreading services. Ensure your work is error-free and ready for publication.",
      color: "purple",
      pricing: [
        { name: "Basic", price: 10, unit: "per word" },
        { name: "Standard", price: 15, unit: "per word" },
        { name: "Premium", price: 20, unit: "per word" },
      ],
      features: [
        "Spelling and grammar check",
        "Punctuation review",
        "Consistency check",
        "Formatting review (Premium)",
        "Style suggestions (Premium)",
      ],
    },
    {
      title: "Ghost Writing",
      icon: Sparkles,
      description:
        "Bring your ideas to life with our professional ghost writing services. We'll help you craft compelling stories and non-fiction works.",
      color: "pink",
      pricing: [
        { name: "Basic", price: 50, unit: "per word" },
        { name: "Standard", price: 75, unit: "per word" },
        { name: "Premium", price: 100, unit: "per word" },
      ],
      features: [
        "Outline development",
        "First draft writing",
        "Two rounds of revisions",
        "Research assistance (Standard & Premium)",
        "Personalized writing style matching (Premium)",
      ],
    },
    {
      title: "Publishing Consultation",
      icon: BookOpen,
      description:
        "Navigate the publishing world with confidence. Get expert advice on traditional and self-publishing routes.",
      color: "indigo",
      pricing: [
        { name: "Single Session", price: 25000, unit: "per hour" },
        { name: "Package (3 sessions)", price: 60000, unit: "total" },
        { name: "Comprehensive", price: 150000, unit: "total" },
      ],
      features: [
        "Publishing route analysis",
        "Manuscript evaluation",
        "Query letter review",
        "Marketing strategy (Package & Comprehensive)",
        "Agent/Publisher connections (Comprehensive)",
      ],
    },
  ]

  return (
    <div className="bg-gradient-to-b from-purple-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <header className="bg-white dark:bg-gray-900 shadow-md">
        <div className="container py-6 px-4 sm:py-8 sm:px-6">
          <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-center bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-pink-600">
            Professional Writing Services
          </h1>
          <p className="text-center mt-2 sm:mt-4 text-sm sm:text-base lg:text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto px-4">
            Elevate your writing with our expert services tailored to your needs.
          </p>
        </div>
      </header>

      <main className="container py-8 px-4 sm:py-12 sm:px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {services.map((service, index) => (
            <Card
              key={index}
              className={`bg-${service.color}-50 dark:bg-${service.color}-900/50 shadow-lg hover:shadow-2xl transition-all duration-300 rounded-2xl overflow-hidden`}
            >
              <CardHeader className={`bg-${service.color}-100 dark:bg-${service.color}-800 p-4 sm:p-6`}>
                <CardTitle
                  className={`flex items-center gap-2 text-lg sm:text-xl lg:text-2xl font-semibold text-${service.color}-600 dark:text-${service.color}-400`}
                >
                  <service.icon className="w-6 h-6 sm:w-8 sm:h-8 flex-shrink-0" />
                  <span className="leading-tight">{service.title}</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 sm:p-6">
                <CardDescription className="text-sm sm:text-base text-gray-600 dark:text-gray-300 mb-4 sm:mb-6 leading-relaxed">
                  {service.description}
                </CardDescription>
                <div className="space-y-3 sm:space-y-4 mb-4 sm:mb-6">
                  {service.pricing.map((tier, i) => (
                    <div
                      key={i}
                      className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 sm:gap-0 p-3 bg-white dark:bg-gray-700 rounded-lg shadow"
                    >
                      <span className="font-semibold text-sm sm:text-base text-gray-700 dark:text-gray-300">{tier.name}</span>
                      <span className="text-base sm:text-lg font-bold text-purple-600 dark:text-purple-400">
                        ₦{tier.price.toLocaleString()}{" "}
                        <span className="text-xs sm:text-sm font-normal text-gray-500 dark:text-gray-400">{tier.unit}</span>
                      </span>
                    </div>
                  ))}
                </div>
                <ul className="space-y-2 mb-4 sm:mb-6">
                  {service.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm sm:text-base text-gray-600 dark:text-gray-300">
                      <Check className={`w-4 h-4 sm:w-5 sm:h-5 mt-0.5 flex-shrink-0 text-${service.color}-600 dark:text-${service.color}-400`} />
                      <span className="leading-relaxed">{feature}</span>
                    </li>
                  ))}
                </ul>
                <Button
                  className={`w-full bg-${service.color}-600 text-white hover:bg-${service.color}-700 dark:bg-${service.color}-700 dark:hover:bg-${service.color}-600 transition-colors duration-200 text-sm sm:text-base py-2 sm:py-3`}
                >
                  Get Started
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </main>
    </div>
  )
}

