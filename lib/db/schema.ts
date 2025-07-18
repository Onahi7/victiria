import { 
  pgTable, 
  serial, 
  text, 
  varchar, 
  integer, 
  decimal, 
  boolean, 
  timestamp, 
  uuid, 
  jsonb,
  pgEnum
} from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'

// Enums
export const userRoleEnum = pgEnum('user_role', ['admin', 'author', 'reader', 'guest'])
export const bookStatusEnum = pgEnum('book_status', ['draft', 'pending_review', 'approved', 'published', 'rejected', 'archived'])
export const submissionStatusEnum = pgEnum('submission_status', ['draft', 'submitted', 'under_review', 'approved', 'rejected', 'published'])
export const orderStatusEnum = pgEnum('order_status', ['pending', 'processing', 'shipped', 'delivered', 'cancelled'])
export const paymentStatusEnum = pgEnum('payment_status', ['pending', 'completed', 'failed', 'refunded'])
export const postStatusEnum = pgEnum('post_status', ['draft', 'published', 'archived'])
export const eventTypeEnum = pgEnum('event_type', ['workshop', 'webinar', 'book_launch', 'masterclass', 'meet_greet', 'conference'])
export const eventStatusEnum = pgEnum('event_status', ['draft', 'published', 'cancelled', 'completed'])
export const registrationStatusEnum = pgEnum('registration_status', ['registered', 'attended', 'cancelled', 'no_show'])

// Users & Authentication
export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  name: varchar('name', { length: 255 }).notNull(),
  password: varchar('password', { length: 255 }),
  avatar: text('avatar'),
  phone: varchar('phone', { length: 20 }),
  bio: text('bio'),
  role: userRoleEnum('role').default('reader').notNull(),
  emailVerified: timestamp('email_verified'),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

export const accounts = pgTable('accounts', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  type: varchar('type', { length: 50 }).notNull(),
  provider: varchar('provider', { length: 50 }).notNull(),
  providerAccountId: varchar('provider_account_id', { length: 255 }).notNull(),
  refreshToken: text('refresh_token'),
  accessToken: text('access_token'),
  expiresAt: integer('expires_at'),
  tokenType: varchar('token_type', { length: 50 }),
  scope: varchar('scope', { length: 255 }),
  idToken: text('id_token'),
  sessionState: varchar('session_state', { length: 255 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

export const sessions = pgTable('sessions', {
  id: uuid('id').defaultRandom().primaryKey(),
  sessionToken: varchar('session_token', { length: 255 }).notNull().unique(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  expires: timestamp('expires').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

// Books & Publishing
export const bookCategories = pgTable('book_categories', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 100 }).notNull(),
  description: text('description'),
  slug: varchar('slug', { length: 100 }).notNull().unique(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

export const books = pgTable('books', {
  id: uuid('id').defaultRandom().primaryKey(),
  title: varchar('title', { length: 255 }).notNull(),
  author: varchar('author', { length: 255 }).notNull(),
  authorId: uuid('author_id').references(() => users.id), // Link to actual user who published
  description: text('description'),
  excerpt: text('excerpt'),
  price: decimal('price', { precision: 10, scale: 2 }).notNull(),
  coverImage: text('cover_image'),
  status: bookStatusEnum('status').default('draft').notNull(),
  category: varchar('category', { length: 100 }),
  tags: jsonb('tags'), // Array of tag strings
  stock: integer('stock').default(0),
  isAvailable: boolean('is_available').default(true),
  digitalDownload: text('digital_download'),
  bookFile: text('book_file'), // PDF/EPUB file URL
  isbn: varchar('isbn', { length: 50 }),
  pageCount: integer('page_count'),
  language: varchar('language', { length: 50 }).default('English'),
  publishedAt: timestamp('published_at'),
  submittedAt: timestamp('submitted_at'),
  reviewedAt: timestamp('reviewed_at'),
  reviewedBy: uuid('reviewed_by').references(() => users.id),
  reviewNotes: text('review_notes'),
  royaltyRate: decimal('royalty_rate', { precision: 5, scale: 2 }).default('70.00'), // Percentage author gets
  salesCount: integer('sales_count').default(0),
  totalRevenue: decimal('total_revenue', { precision: 12, scale: 2 }).default('0.00'),
  authorRevenue: decimal('author_revenue', { precision: 12, scale: 2 }).default('0.00'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

// Author Publishing Submissions
export const bookSubmissions = pgTable('book_submissions', {
  id: uuid('id').defaultRandom().primaryKey(),
  authorId: uuid('author_id').notNull().references(() => users.id),
  bookId: uuid('book_id').references(() => books.id),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description').notNull(),
  category: varchar('category', { length: 100 }).notNull(),
  price: decimal('price', { precision: 10, scale: 2 }).notNull(),
  manuscriptFile: text('manuscript_file').notNull(), // PDF/DOC file
  coverImage: text('cover_image'),
  synopsis: text('synopsis'),
  authorBio: text('author_bio'),
  targetAudience: text('target_audience'),
  marketingPlan: text('marketing_plan'),
  status: submissionStatusEnum('status').default('draft').notNull(),
  submissionFee: decimal('submission_fee', { precision: 10, scale: 2 }).default('5000.00'), // ₦5,000 submission fee
  feePaymentStatus: paymentStatusEnum('fee_payment_status').default('pending'),
  feePaymentReference: varchar('fee_payment_reference', { length: 255 }),
  submittedAt: timestamp('submitted_at'),
  reviewStartedAt: timestamp('review_started_at'),
  reviewedAt: timestamp('reviewed_at'),
  reviewedBy: uuid('reviewed_by').references(() => users.id),
  reviewNotes: text('review_notes'),
  rejectionReason: text('rejection_reason'),
  adminNotes: text('admin_notes'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

// Author Revenue Tracking
export const authorRevenues = pgTable('author_revenues', {
  id: uuid('id').defaultRandom().primaryKey(),
  authorId: uuid('author_id').notNull().references(() => users.id),
  bookId: uuid('book_id').notNull().references(() => books.id),
  orderId: uuid('order_id').notNull().references(() => orders.id),
  saleAmount: decimal('sale_amount', { precision: 10, scale: 2 }).notNull(),
  royaltyRate: decimal('royalty_rate', { precision: 5, scale: 2 }).notNull(),
  authorEarning: decimal('author_earning', { precision: 10, scale: 2 }).notNull(),
  platformFee: decimal('platform_fee', { precision: 10, scale: 2 }).notNull(),
  status: varchar('status', { length: 50 }).default('pending'), // pending, processed, paid
  paidAt: timestamp('paid_at'),
  paymentReference: varchar('payment_reference', { length: 255 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

// Author Payouts
export const authorPayouts = pgTable('author_payouts', {
  id: uuid('id').defaultRandom().primaryKey(),
  authorId: uuid('author_id').notNull().references(() => users.id),
  amount: decimal('amount', { precision: 10, scale: 2 }).notNull(),
  currency: varchar('currency', { length: 3 }).default('NGN'),
  status: varchar('status', { length: 50 }).default('pending'), // pending, processing, completed, failed
  paymentMethod: varchar('payment_method', { length: 50 }), // bank_transfer, paystack, etc
  bankDetails: jsonb('bank_details'), // Account details
  paymentReference: varchar('payment_reference', { length: 255 }),
  processedAt: timestamp('processed_at'),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

// Author-Admin Communications
export const authorMessages = pgTable('author_messages', {
  id: uuid('id').defaultRandom().primaryKey(),
  authorId: uuid('author_id').notNull().references(() => users.id),
  adminId: uuid('admin_id').references(() => users.id),
  submissionId: uuid('submission_id').references(() => bookSubmissions.id),
  subject: varchar('subject', { length: 255 }).notNull(),
  message: text('message').notNull(),
  isFromAuthor: boolean('is_from_author').notNull(),
  isRead: boolean('is_read').default(false),
  priority: varchar('priority', { length: 20 }).default('normal'), // low, normal, high, urgent
  attachments: jsonb('attachments'), // Array of file URLs
  createdAt: timestamp('created_at').defaultNow().notNull(),
  readAt: timestamp('read_at'),
})

// Author Profiles (Extended user info for authors)
export const authorProfiles = pgTable('author_profiles', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }).unique(),
  displayName: varchar('display_name', { length: 255 }),
  bio: text('bio'),
  website: varchar('website', { length: 255 }),
  socialLinks: jsonb('social_links'), // Facebook, Twitter, Instagram, etc
  genres: jsonb('genres'), // Array of preferred genres
  publishingGoals: text('publishing_goals'),
  experience: text('experience'),
  education: text('education'),
  awards: jsonb('awards'), // Array of awards/achievements
  totalBooks: integer('total_books').default(0),
  totalSales: integer('total_sales').default(0),
  totalRevenue: decimal('total_revenue', { precision: 12, scale: 2 }).default('0.00'),
  isVerified: boolean('is_verified').default(false),
  verifiedAt: timestamp('verified_at'),
  bankDetails: jsonb('bank_details'), // For payouts
  taxInfo: jsonb('tax_info'), // Tax-related information
  contractSigned: boolean('contract_signed').default(false),
  contractSignedAt: timestamp('contract_signed_at'),
  status: varchar('status', { length: 50 }).default('active'), // active, suspended, banned
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

// Orders & Payments
export const orders = pgTable('orders', {
  id: uuid('id').defaultRandom().primaryKey(),
  orderNumber: varchar('order_number', { length: 50 }).notNull().unique(),
  userId: uuid('user_id').notNull().references(() => users.id),
  bookId: uuid('book_id').notNull().references(() => books.id),
  total: decimal('total', { precision: 10, scale: 2 }).notNull(),
  status: orderStatusEnum('status').default('pending').notNull(),
  paymentMethod: varchar('payment_method', { length: 50 }),
  paymentStatus: paymentStatusEnum('payment_status').default('pending').notNull(),
  paymentReference: varchar('payment_reference', { length: 255 }),
  trackingNumber: varchar('tracking_number', { length: 100 }),
  shippingAddress: jsonb('shipping_address'),
  billingAddress: jsonb('billing_address'),
  notes: text('notes'),
  paidAt: timestamp('paid_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

export const orderItems = pgTable('order_items', {
  id: uuid('id').defaultRandom().primaryKey(),
  orderId: uuid('order_id').notNull().references(() => orders.id, { onDelete: 'cascade' }),
  bookId: uuid('book_id').notNull().references(() => books.id),
  quantity: integer('quantity').notNull(),
  price: decimal('price', { precision: 10, scale: 2 }).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

export const transactions = pgTable('transactions', {
  id: uuid('id').defaultRandom().primaryKey(),
  orderId: uuid('order_id').notNull().references(() => orders.id),
  paymentId: varchar('payment_id', { length: 255 }),
  amount: decimal('amount', { precision: 10, scale: 2 }).notNull(),
  status: paymentStatusEnum('status').default('pending').notNull(),
  provider: varchar('provider', { length: 50 }), // 'paystack' or 'flutterwave'
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

export const paymentTransactions = pgTable('payment_transactions', {
  id: uuid('id').defaultRandom().primaryKey(),
  orderId: uuid('order_id').notNull().references(() => orders.id),
  reference: varchar('reference', { length: 255 }).notNull().unique(),
  provider: varchar('provider', { length: 50 }).notNull(), // 'paystack' or 'flutterwave'
  status: varchar('status', { length: 50 }).notNull(), // 'successful', 'failed', 'pending'
  amount: decimal('amount', { precision: 10, scale: 2 }).notNull(),
  currency: varchar('currency', { length: 3 }).notNull(),
  customerEmail: varchar('customer_email', { length: 255 }).notNull(),
  metadata: jsonb('metadata'),
  providerResponse: jsonb('provider_response'),
  verifiedAt: timestamp('verified_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

export const verificationTokens = pgTable('verification_tokens', {
  identifier: varchar('identifier', { length: 255 }).notNull(),
  token: varchar('token', { length: 255 }).notNull().unique(),
  expires: timestamp('expires').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

export const categories = pgTable('categories', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: varchar('name', { length: 100 }).notNull(),
  slug: varchar('slug', { length: 100 }).notNull().unique(),
  description: text('description'),
  type: varchar('type', { length: 20 }).notNull(), // 'book' or 'blog'
  color: varchar('color', { length: 7 }), // hex color
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

export const userPreferences = pgTable('user_preferences', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }).unique(),
  theme: varchar('theme', { length: 20 }).default('system'), // 'light', 'dark', 'system'
  emailNotifications: jsonb('email_notifications'),
  privacySettings: jsonb('privacy_settings'),
  readingPreferences: jsonb('reading_preferences'),
  language: varchar('language', { length: 10 }).default('en'),
  timezone: varchar('timezone', { length: 50 }).default('UTC'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

export const wishlists = pgTable('wishlists', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  bookId: uuid('book_id').notNull().references(() => books.id, { onDelete: 'cascade' }),
  addedAt: timestamp('added_at').defaultNow().notNull(),
})

export const reviews = pgTable('reviews', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  bookId: uuid('book_id').notNull().references(() => books.id, { onDelete: 'cascade' }),
  rating: integer('rating').notNull(), // 1-5 stars
  comment: text('comment'),
  isVerifiedPurchase: boolean('is_verified_purchase').default(false),
  isPublished: boolean('is_published').default(true),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

export const readingProgress = pgTable('reading_progress', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  bookId: uuid('book_id').notNull().references(() => books.id, { onDelete: 'cascade' }),
  currentPage: integer('current_page').default(0),
  totalPages: integer('total_pages'),
  percentage: integer('percentage').default(0), // 0-100
  lastReadAt: timestamp('last_read_at').defaultNow().notNull(),
  isCompleted: boolean('is_completed').default(false),
  completedAt: timestamp('completed_at'),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

// Blog & Content
export const postCategories = pgTable('post_categories', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 100 }).notNull(),
  description: text('description'),
  slug: varchar('slug', { length: 100 }).notNull().unique(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

export const blogPosts = pgTable('blog_posts', {
  id: uuid('id').defaultRandom().primaryKey(),
  title: varchar('title', { length: 255 }).notNull(),
  content: text('content').notNull(),
  excerpt: text('excerpt'),
  slug: varchar('slug', { length: 255 }).notNull().unique(),
  coverImage: text('cover_image'),
  status: postStatusEnum('status').default('draft').notNull(),
  category: varchar('category', { length: 100 }),
  tags: jsonb('tags'), // Array of tag strings
  authorId: uuid('author_id').notNull().references(() => users.id),
  seoTitle: varchar('seo_title', { length: 255 }),
  seoDescription: text('seo_description'),
  publishedAt: timestamp('published_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

// Community
export const communityMembers = pgTable('community_members', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id),
  joinedAt: timestamp('joined_at').defaultNow().notNull(),
  role: varchar('role', { length: 50 }).default('member'),
  bio: text('bio'),
  isActive: boolean('is_active').default(true),
})

export const discussions = pgTable('discussions', {
  id: uuid('id').defaultRandom().primaryKey(),
  title: varchar('title', { length: 255 }).notNull(),
  content: text('content').notNull(),
  authorId: uuid('author_id').notNull().references(() => users.id),
  isPinned: boolean('is_pinned').default(false),
  isLocked: boolean('is_locked').default(false),
  viewCount: integer('view_count').default(0),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

export const discussionReplies = pgTable('discussion_replies', {
  id: uuid('id').defaultRandom().primaryKey(),
  discussionId: uuid('discussion_id').notNull().references(() => discussions.id, { onDelete: 'cascade' }),
  content: text('content').notNull(),
  authorId: uuid('author_id').notNull().references(() => users.id),
  parentId: uuid('parent_id').references((): any => discussionReplies.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

export const events = pgTable('events', {
  id: uuid('id').defaultRandom().primaryKey(),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description'),
  shortDescription: varchar('short_description', { length: 500 }),
  type: eventTypeEnum('type').notNull(),
  status: eventStatusEnum('status').default('draft').notNull(),
  startDate: timestamp('start_date').notNull(),
  endDate: timestamp('end_date'),
  timezone: varchar('timezone', { length: 50 }).default('Africa/Lagos'),
  location: varchar('location', { length: 255 }),
  isOnline: boolean('is_online').default(false),
  meetingUrl: text('meeting_url'),
  maxAttendees: integer('max_attendees'),
  price: decimal('price', { precision: 10, scale: 2 }).default('0.00'),
  isFree: boolean('is_free').default(true),
  featuredImage: text('featured_image'),
  agenda: jsonb('agenda'), // Array of agenda items
  requirements: text('requirements'),
  whatYouWillLearn: text('what_you_will_learn'),
  targetAudience: text('target_audience'),
  organizerId: uuid('organizer_id').notNull().references(() => users.id),
  isPublished: boolean('is_published').default(false),
  registrationDeadline: timestamp('registration_deadline'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

export const eventRegistrations = pgTable('event_registrations', {
  id: uuid('id').defaultRandom().primaryKey(),
  eventId: uuid('event_id').notNull().references(() => events.id, { onDelete: 'cascade' }),
  userId: uuid('user_id').notNull().references(() => users.id),
  status: registrationStatusEnum('status').default('registered'),
  paymentStatus: paymentStatusEnum('payment_status').default('pending'),
  paymentReference: varchar('payment_reference', { length: 255 }),
  amountPaid: decimal('amount_paid', { precision: 10, scale: 2 }),
  specialRequests: text('special_requests'),
  attendedAt: timestamp('attended_at'),
  certificateIssued: boolean('certificate_issued').default(false),
  registeredAt: timestamp('registered_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

// Courses & Academy
export const courses = pgTable('courses', {
  id: uuid('id').defaultRandom().primaryKey(),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description'),
  price: decimal('price', { precision: 10, scale: 2 }).notNull(),
  thumbnailImage: text('thumbnail_image'),
  instructorId: uuid('instructor_id').notNull().references(() => users.id),
  isPublished: boolean('is_published').default(false),
  duration: integer('duration'), // in minutes
  level: varchar('level', { length: 50 }), // 'beginner', 'intermediate', 'advanced'
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

export const courseModules = pgTable('course_modules', {
  id: uuid('id').defaultRandom().primaryKey(),
  courseId: uuid('course_id').notNull().references(() => courses.id, { onDelete: 'cascade' }),
  title: varchar('title', { length: 255 }).notNull(),
  content: text('content'),
  videoUrl: text('video_url'),
  duration: integer('duration'), // in minutes
  order: integer('order').notNull(),
  isPreview: boolean('is_preview').default(false),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

export const enrollments = pgTable('enrollments', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id),
  courseId: uuid('course_id').notNull().references(() => courses.id),
  progress: integer('progress').default(0), // percentage 0-100
  completedAt: timestamp('completed_at'),
  enrolledAt: timestamp('enrolled_at').defaultNow().notNull(),
})

export const courseReviews = pgTable('course_reviews', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  courseId: uuid('course_id').notNull().references(() => courses.id, { onDelete: 'cascade' }),
  rating: integer('rating').notNull(), // 1-5 stars
  comment: text('comment'),
  isVerifiedEnrollment: boolean('is_verified_enrollment').default(false),
  isPublished: boolean('is_published').default(true),
  instructorReply: text('instructor_reply'),
  repliedAt: timestamp('replied_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

// Newsletter
export const newsletterSubscribers = pgTable('newsletter_subscribers', {
  id: uuid('id').defaultRandom().primaryKey(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  name: varchar('name', { length: 255 }),
  isActive: boolean('is_active').default(true),
  subscribedAt: timestamp('subscribed_at').defaultNow().notNull(),
  unsubscribedAt: timestamp('unsubscribed_at'),
})

// Relations
export const usersRelations = relations(users, ({ many, one }) => ({
  accounts: many(accounts),
  sessions: many(sessions),
  orders: many(orders),
  blogPosts: many(blogPosts),
  communityMember: many(communityMembers),
  discussions: many(discussions),
  discussionReplies: many(discussionReplies),
  events: many(events),
  eventRegistrations: many(eventRegistrations),
  courses: many(courses),
  enrollments: many(enrollments),
  authoredBooks: many(books, { relationName: 'authoredBooks' }),
  bookSubmissions: many(bookSubmissions),
  authorProfile: one(authorProfiles),
  authorRevenues: many(authorRevenues),
  authorPayouts: many(authorPayouts),
  sentMessages: many(authorMessages, { relationName: 'sentMessages' }),
  receivedMessages: many(authorMessages, { relationName: 'receivedMessages' }),
}))

export const booksRelations = relations(books, ({ many, one }) => ({
  orderItems: many(orderItems),
  author: one(users, {
    fields: [books.authorId],
    references: [users.id],
    relationName: 'authoredBooks'
  }),
  reviewer: one(users, {
    fields: [books.reviewedBy],
    references: [users.id],
  }),
  revenues: many(authorRevenues),
  submissions: many(bookSubmissions),
}))

export const bookSubmissionsRelations = relations(bookSubmissions, ({ one, many }) => ({
  author: one(users, {
    fields: [bookSubmissions.authorId],
    references: [users.id],
  }),
  book: one(books, {
    fields: [bookSubmissions.bookId],
    references: [books.id],
  }),
  reviewer: one(users, {
    fields: [bookSubmissions.reviewedBy],
    references: [users.id],
  }),
  messages: many(authorMessages),
}))

export const authorProfilesRelations = relations(authorProfiles, ({ one }) => ({
  user: one(users, {
    fields: [authorProfiles.userId],
    references: [users.id],
  }),
}))

export const authorRevenuesRelations = relations(authorRevenues, ({ one }) => ({
  author: one(users, {
    fields: [authorRevenues.authorId],
    references: [users.id],
  }),
  book: one(books, {
    fields: [authorRevenues.bookId],
    references: [books.id],
  }),
  order: one(orders, {
    fields: [authorRevenues.orderId],
    references: [orders.id],
  }),
}))

export const authorPayoutsRelations = relations(authorPayouts, ({ one }) => ({
  author: one(users, {
    fields: [authorPayouts.authorId],
    references: [users.id],
  }),
}))

export const authorMessagesRelations = relations(authorMessages, ({ one }) => ({
  author: one(users, {
    fields: [authorMessages.authorId],
    references: [users.id],
    relationName: 'sentMessages'
  }),
  admin: one(users, {
    fields: [authorMessages.adminId],
    references: [users.id],
    relationName: 'receivedMessages'
  }),
  submission: one(bookSubmissions, {
    fields: [authorMessages.submissionId],
    references: [bookSubmissions.id],
  }),
}))

export const ordersRelations = relations(orders, ({ one, many }) => ({
  user: one(users, {
    fields: [orders.userId],
    references: [users.id],
  }),
  items: many(orderItems),
  transactions: many(transactions),
}))

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, {
    fields: [orderItems.orderId],
    references: [orders.id],
  }),
  book: one(books, {
    fields: [orderItems.bookId],
    references: [books.id],
  }),
}))

export const blogPostsRelations = relations(blogPosts, ({ one }) => ({
  author: one(users, {
    fields: [blogPosts.authorId],
    references: [users.id],
  }),
}))

export const discussionsRelations = relations(discussions, ({ one, many }) => ({
  author: one(users, {
    fields: [discussions.authorId],
    references: [users.id],
  }),
  replies: many(discussionReplies),
}))

export const discussionRepliesRelations = relations(discussionReplies, ({ one, many }) => ({
  discussion: one(discussions, {
    fields: [discussionReplies.discussionId],
    references: [discussions.id],
  }),
  author: one(users, {
    fields: [discussionReplies.authorId],
    references: [users.id],
  }),
  parent: one(discussionReplies, {
    fields: [discussionReplies.parentId],
    references: [discussionReplies.id],
  }),
  children: many(discussionReplies),
}))

export const coursesRelations = relations(courses, ({ one, many }) => ({
  instructor: one(users, {
    fields: [courses.instructorId],
    references: [users.id],
  }),
  modules: many(courseModules),
  enrollments: many(enrollments),
  reviews: many(courseReviews),
}))

export const courseModulesRelations = relations(courseModules, ({ one }) => ({
  course: one(courses, {
    fields: [courseModules.courseId],
    references: [courses.id],
  }),
}))

export const enrollmentsRelations = relations(enrollments, ({ one }) => ({
  user: one(users, {
    fields: [enrollments.userId],
    references: [users.id],
  }),
  course: one(courses, {
    fields: [enrollments.courseId],
    references: [courses.id],
  }),
}))

export const courseReviewsRelations = relations(courseReviews, ({ one }) => ({
  user: one(users, {
    fields: [courseReviews.userId],
    references: [users.id],
  }),
  course: one(courses, {
    fields: [courseReviews.courseId],
    references: [courses.id],
  }),
}))

export const eventsRelations = relations(events, ({ one, many }) => ({
  organizer: one(users, {
    fields: [events.organizerId],
    references: [users.id],
  }),
  registrations: many(eventRegistrations),
}))

export const eventRegistrationsRelations = relations(eventRegistrations, ({ one }) => ({
  event: one(events, {
    fields: [eventRegistrations.eventId],
    references: [events.id],
  }),
  user: one(users, {
    fields: [eventRegistrations.userId],
    references: [users.id],
  }),
}))
