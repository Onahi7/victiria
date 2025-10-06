# API Audit Report

## Frontend API Calls Found

### From App Pages:
- `/api/publishing/submissions` (GET, POST)
- `/api/publishing/dashboard` (GET)
- `/api/books` (GET)
- `/api/auth/register` (POST)
- `/api/courses` (GET)
- `/api/courses/{id}` (GET)
- `/api/courses/{id}/enroll` (POST)

### From Components:
- `/api/admin/books` (GET, POST, DELETE)
- `/api/admin/courses` (GET, POST, DELETE)
- `/api/seo/analytics/track` (POST)
- `/api/events` (GET)
- `/api/blog` (GET)
- `/api/wishlist` (POST)
- `/api/seo` (GET)
- `/api/profile` (PUT)
- `/api/profile/password` (PUT)
- `/api/profile/avatar` (POST)
- `/api/newsletter/subscribe` (POST)
- `/api/publishing/submit` (POST)
- `/api/courses/{id}/reviews` (GET, POST)
- `/api/orders` (POST)
- `/api/payment/initialize` (POST)
- `/api/cart` (POST)
- `/api/admin/seo/settings` (GET, POST)
- `/api/admin/seo/redirects` (GET)
- `/api/admin/seo/analytics` (GET)
- `/api/admin/seo/settings/{id}` (DELETE)

### From Hooks:
- `/api/seo` (GET, POST)
- `/api/seo/analytics/track` (POST)

## Backend API Routes Available

### Auth & Users:
✅ `/api/auth/[...nextauth]`
✅ `/api/auth/register`
✅ `/api/auth/reset-password`
✅ `/api/auth/verify-email`
✅ `/api/users/me`
✅ `/api/users/profile`
✅ `/api/users/password`
✅ `/api/users/preferences`

### Books & Content:
✅ `/api/books`
✅ `/api/books/[id]`
✅ `/api/blog`
✅ `/api/blog/[id]`
✅ `/api/categories`
✅ `/api/categories/[id]`
✅ `/api/courses`
✅ `/api/courses/[id]`
✅ `/api/courses/[id]/enroll`
✅ `/api/courses/[id]/progress`
✅ `/api/courses/[id]/reviews`

### Events:
✅ `/api/events`
✅ `/api/events/[id]`
✅ `/api/events/[id]/register`

### Orders & Payment:
✅ `/api/orders`
✅ `/api/orders/[id]`
✅ `/api/payment/initialize`
✅ `/api/payment/verify`
✅ `/api/payment/verify/paystack`
✅ `/api/payment/verify/flutterwave`

### Publishing:
✅ `/api/publishing/dashboard`
✅ `/api/publishing/submissions`
✅ `/api/publishing/submissions/[id]/pay`

### Admin:
✅ `/api/admin/books`
✅ `/api/admin/blog`
✅ `/api/admin/blog/[id]`
✅ `/api/admin/courses`
✅ `/api/admin/events`
✅ `/api/admin/seo/analytics`
✅ `/api/admin/seo/settings`
✅ `/api/admin/seo/settings/[id]`
✅ `/api/admin/seo/redirects`
✅ `/api/admin/seo/redirects/[id]`
✅ `/api/admin/newsletter/subscribers`
✅ `/api/admin/newsletter/send`
✅ `/api/admin/email-templates`
✅ `/api/admin/stats`

### Other:
✅ `/api/wishlist`
✅ `/api/newsletter/subscribe`
✅ `/api/newsletter/unsubscribe`
✅ `/api/seo`
✅ `/api/seo/analytics/track`
✅ `/api/search`
✅ `/api/recommendations`
✅ `/api/reviews`
✅ `/api/analytics`
✅ `/api/health`
✅ `/api/upload`

## Missing APIs

❌ `/api/profile` - Used in components/profile-settings.tsx (PUT)
❌ `/api/profile/password` - Used in components/profile-settings.tsx (PUT)
❌ `/api/profile/avatar` - Used in components/profile-settings.tsx (POST)
❌ `/api/publishing/submit` - Used in components/manuscript-submission-form.tsx (POST)
❌ `/api/cart` - Used in components/book-purchase.tsx (POST)

## Analysis

The frontend is expecting these profile-related APIs that map to user endpoints:
- `/api/profile` should likely map to `/api/users/profile`
- `/api/profile/password` should likely map to `/api/users/password`
- `/api/profile/avatar` functionality might need to be added to `/api/users/profile`

The `/api/publishing/submit` might be intended to map to `/api/publishing/submissions` POST endpoint.

The `/api/cart` endpoint is missing entirely and would need to be created if cart functionality is required.

## Recommendations

1. **Update frontend components to use correct API endpoints:**
   - Change `/api/profile` to `/api/users/profile`
   - Change `/api/profile/password` to `/api/users/password`
   - Change `/api/publishing/submit` to `/api/publishing/submissions`

2. **Create missing endpoints:**
   - `/api/cart` for shopping cart functionality
   - Add avatar upload functionality to `/api/users/profile` or create `/api/users/avatar`

3. **Verify API implementations match frontend expectations**
