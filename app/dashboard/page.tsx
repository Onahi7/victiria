import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Users, TrendingUp, DollarSign, BookMarked, Eye, BarChart3 } from "lucide-react"
import Image from "next/image"
import AdminDashboard from "@/components/admin-dashboard"

export default function DashboardPage() {
  return <AdminDashboard />
}

