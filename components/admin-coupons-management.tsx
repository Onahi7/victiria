'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { CalendarIcon, Plus, Edit, Trash2, Copy, Eye } from 'lucide-react'
import { format } from 'date-fns'
import { toast } from '@/hooks/use-toast'

interface Coupon {
  id: string
  code: string
  name: string
  description: string
  type: 'percentage' | 'fixed'
  value: string
  minOrderAmount: string
  maxDiscountAmount: string | null
  usageLimit: number | null
  usedCount: number
  userLimit: number
  appliesTo: 'all' | 'books' | 'courses' | 'specific'
  applicableItems: any
  isActive: boolean
  startsAt: string
  expiresAt: string | null
  createdAt: string
}

export default function AdminCouponsManagement() {
  const [coupons, setCoupons] = useState<Coupon[]>([])
  const [loading, setLoading] = useState(true)
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [activeTab, setActiveTab] = useState('all')

  // Form states
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    description: '',
    type: 'percentage' as const,
    value: '',
    minOrderAmount: '0',
    maxDiscountAmount: '',
    usageLimit: '',
    userLimit: '1',
    appliesTo: 'all' as const,
    applicableItems: [],
    startsAt: new Date(),
    expiresAt: null as Date | null
  })

  useEffect(() => {
    fetchCoupons()
  }, [activeTab])

  const fetchCoupons = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (activeTab !== 'all') {
        params.append('status', activeTab)
      }
      
      const response = await fetch(`/api/admin/coupons?${params.toString()}`)
      if (response.ok) {
        const result = await response.json()
        setCoupons(result.data)
      } else {
        toast({
          title: "Error",
          description: "Failed to fetch coupons",
          variant: "destructive"
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch coupons",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setFormData({
      code: '',
      name: '',
      description: '',
      type: 'percentage',
      value: '',
      minOrderAmount: '0',
      maxDiscountAmount: '',
      usageLimit: '',
      userLimit: '1',
      appliesTo: 'all',
      applicableItems: [],
      startsAt: new Date(),
      expiresAt: null
    })
    setEditingCoupon(null)
    setIsCreating(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const url = editingCoupon 
        ? `/api/admin/coupons/${editingCoupon.id}` 
        : '/api/admin/coupons'
      
      const method = editingCoupon ? 'PUT' : 'POST'
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          value: parseFloat(formData.value),
          minOrderAmount: parseFloat(formData.minOrderAmount),
          maxDiscountAmount: formData.maxDiscountAmount ? parseFloat(formData.maxDiscountAmount) : null,
          usageLimit: formData.usageLimit ? parseInt(formData.usageLimit) : null,
          userLimit: parseInt(formData.userLimit),
        }),
      })

      const result = await response.json()

      if (response.ok) {
        toast({
          title: "Success",
          description: result.message,
        })
        fetchCoupons()
        resetForm()
      } else {
        toast({
          title: "Error",
          description: result.error,
          variant: "destructive"
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save coupon",
        variant: "destructive"
      })
    }
  }

  const handleEdit = (coupon: Coupon) => {
    setEditingCoupon(coupon)
    setFormData({
      code: coupon.code,
      name: coupon.name,
      description: coupon.description,
      type: coupon.type,
      value: coupon.value,
      minOrderAmount: coupon.minOrderAmount,
      maxDiscountAmount: coupon.maxDiscountAmount || '',
      usageLimit: coupon.usageLimit?.toString() || '',
      userLimit: coupon.userLimit.toString(),
      appliesTo: coupon.appliesTo,
      applicableItems: coupon.applicableItems || [],
      startsAt: new Date(coupon.startsAt),
      expiresAt: coupon.expiresAt ? new Date(coupon.expiresAt) : null
    })
    setIsCreating(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this coupon?')) return

    try {
      const response = await fetch(`/api/admin/coupons/${id}`, {
        method: 'DELETE',
      })

      const result = await response.json()

      if (response.ok) {
        toast({
          title: "Success",
          description: "Coupon deleted successfully",
        })
        fetchCoupons()
      } else {
        toast({
          title: "Error",
          description: result.error,
          variant: "destructive"
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete coupon",
        variant: "destructive"
      })
    }
  }

  const getCouponStatus = (coupon: Coupon) => {
    const now = new Date()
    const startDate = new Date(coupon.startsAt)
    const endDate = coupon.expiresAt ? new Date(coupon.expiresAt) : null

    if (!coupon.isActive) return { label: 'Inactive', variant: 'secondary' as const }
    if (now < startDate) return { label: 'Upcoming', variant: 'outline' as const }
    if (endDate && now > endDate) return { label: 'Expired', variant: 'destructive' as const }
    if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) return { label: 'Used Up', variant: 'destructive' as const }
    return { label: 'Active', variant: 'default' as const }
  }

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code)
    toast({
      title: "Copied",
      description: "Coupon code copied to clipboard",
    })
  }

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Coupon Management</h1>
        <Button onClick={() => setIsCreating(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Create Coupon
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="all">All Coupons</TabsTrigger>
          <TabsTrigger value="active">Active</TabsTrigger>
          <TabsTrigger value="expired">Expired</TabsTrigger>
          <TabsTrigger value="inactive">Inactive</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-6">
          <div className="grid gap-4">
            {coupons.map((coupon) => {
              const status = getCouponStatus(coupon)
              return (
                <Card key={coupon.id}>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <span className="font-mono bg-gray-100 px-2 py-1 rounded">
                          {coupon.code}
                        </span>
                        <Badge variant={status.variant}>{status.label}</Badge>
                      </CardTitle>
                      <CardDescription>{coupon.name}</CardDescription>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyCode(coupon.code)}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(coupon)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(coupon.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="font-medium">Type:</span> {coupon.type}
                      </div>
                      <div>
                        <span className="font-medium">Value:</span> 
                        {coupon.type === 'percentage' ? `${coupon.value}%` : `$${coupon.value}`}
                      </div>
                      <div>
                        <span className="font-medium">Used:</span> 
                        {coupon.usedCount} / {coupon.usageLimit || '∞'}
                      </div>
                      <div>
                        <span className="font-medium">Expires:</span> 
                        {coupon.expiresAt ? format(new Date(coupon.expiresAt), 'MMM dd, yyyy') : 'Never'}
                      </div>
                    </div>
                    {coupon.description && (
                      <p className="text-sm text-gray-600 mt-2">{coupon.description}</p>
                    )}
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </TabsContent>
      </Tabs>

      {/* Create/Edit Modal */}
      {isCreating && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <CardTitle>
                {editingCoupon ? 'Edit Coupon' : 'Create New Coupon'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="code">Coupon Code *</Label>
                    <Input
                      id="code"
                      value={formData.code}
                      onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                      placeholder="SAVE20"
                      disabled={!!editingCoupon}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="name">Name *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="20% Off Summer Sale"
                      required
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Save 20% on all books this summer"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="type">Discount Type *</Label>
                    <Select
                      value={formData.type}
                      onValueChange={(value: 'percentage' | 'fixed') => 
                        setFormData({ ...formData, type: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="percentage">Percentage</SelectItem>
                        <SelectItem value="fixed">Fixed Amount</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="value">
                      Value * {formData.type === 'percentage' ? '(%)' : '($)'}
                    </Label>
                    <Input
                      id="value"
                      type="number"
                      step="0.01"
                      value={formData.value}
                      onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                      placeholder={formData.type === 'percentage' ? '20' : '10.00'}
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="minOrderAmount">Minimum Order Amount ($)</Label>
                    <Input
                      id="minOrderAmount"
                      type="number"
                      step="0.01"
                      value={formData.minOrderAmount}
                      onChange={(e) => setFormData({ ...formData, minOrderAmount: e.target.value })}
                      placeholder="0.00"
                    />
                  </div>
                  <div>
                    <Label htmlFor="maxDiscountAmount">Maximum Discount Amount ($)</Label>
                    <Input
                      id="maxDiscountAmount"
                      type="number"
                      step="0.01"
                      value={formData.maxDiscountAmount}
                      onChange={(e) => setFormData({ ...formData, maxDiscountAmount: e.target.value })}
                      placeholder="Optional"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="usageLimit">Total Usage Limit</Label>
                    <Input
                      id="usageLimit"
                      type="number"
                      value={formData.usageLimit}
                      onChange={(e) => setFormData({ ...formData, usageLimit: e.target.value })}
                      placeholder="Unlimited"
                    />
                  </div>
                  <div>
                    <Label htmlFor="userLimit">Per User Limit</Label>
                    <Input
                      id="userLimit"
                      type="number"
                      value={formData.userLimit}
                      onChange={(e) => setFormData({ ...formData, userLimit: e.target.value })}
                      placeholder="1"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="appliesTo">Applies To</Label>
                  <Select
                    value={formData.appliesTo}
                    onValueChange={(value: any) => setFormData({ ...formData, appliesTo: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Products</SelectItem>
                      <SelectItem value="books">Books Only</SelectItem>
                      <SelectItem value="courses">Courses Only</SelectItem>
                      <SelectItem value="specific">Specific Items</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Start Date *</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full justify-start text-left font-normal"
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {formData.startsAt ? format(formData.startsAt, 'PPP') : 'Pick a date'}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={formData.startsAt}
                          onSelect={(date) => date && setFormData({ ...formData, startsAt: date })}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                  <div>
                    <Label>Expiry Date</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full justify-start text-left font-normal"
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {formData.expiresAt ? format(formData.expiresAt, 'PPP') : 'No expiry'}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={formData.expiresAt}
                          onSelect={(date) => setFormData({ ...formData, expiresAt: date })}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>

                <div className="flex justify-end space-x-2 pt-4">
                  <Button type="button" variant="outline" onClick={resetForm}>
                    Cancel
                  </Button>
                  <Button type="submit">
                    {editingCoupon ? 'Update' : 'Create'} Coupon
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
