import { z } from 'zod';

// Client validation schemas
export const clientSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name must be less than 100 characters'),
  email: z.string().email('Invalid email address'),
  phone: z.string().optional(),
  status: z.enum(['active', 'inactive', 'pending', 'confirmed', 'completed', 'cancelled', 'no-show']).default('active'),
  birthDate: z.string().min(1, 'Birth date is required'),
  birthTime: z.string().optional(),
  birthPlace: z.string().min(1, 'Birth place is required'),
  question: z.string().min(1, 'Question/focus areas are required'),
  language: z.enum(['en', 'es']).default('en'),
  adminNotes: z.string().optional(),
});

export const clientCreateSchema = clientSchema.extend({
  email: z.string().email('Invalid email address'),
});

export const clientUpdateSchema = clientSchema.partial();

// Schedule validation schemas
export const scheduleSchema = z.object({
  dayOfWeek: z.string().min(1, 'Day of week is required'),
  startTime: z.string().min(1, 'Start time is required'),
  endTime: z.string().min(1, 'End time is required'),
  isAvailable: z.boolean().default(true),
});

export const scheduleCreateSchema = scheduleSchema;
export const scheduleUpdateSchema = scheduleSchema.partial();

// Booking validation schemas
export const bookingSchema = z.object({
  clientEmail: z.string().email('Invalid client email'),
  sessionDate: z.string().min(1, 'Session date is required'),
  sessionTime: z.string().min(1, 'Session time is required'),
  sessionType: z.string().min(1, 'Session type is required'),
  status: z.enum(['pending', 'confirmed', 'completed', 'cancelled', 'no-show']).default('pending'),
  notes: z.string().optional(),
});

export const bookingCreateSchema = bookingSchema;
export const bookingUpdateSchema = bookingSchema.partial();

// Content validation schemas
export const contentSchema = z.object({
  heroTitleEn: z.string().min(1, 'English hero title is required'),
  heroTitleEs: z.string().min(1, 'Spanish hero title is required'),
  heroSubtitleEn: z.string().min(1, 'English hero subtitle is required'),
  heroSubtitleEs: z.string().min(1, 'Spanish hero subtitle is required'),
  aboutTitleEn: z.string().min(1, 'English about title is required'),
  aboutTitleEs: z.string().min(1, 'Spanish about title is required'),
  aboutContentEn: z.string().min(1, 'English about content is required'),
  aboutContentEs: z.string().min(1, 'Spanish about content is required'),
  approachTitleEn: z.string().min(1, 'English approach title is required'),
  approachTitleEs: z.string().min(1, 'Spanish approach title is required'),
  approachContentEn: z.string().min(1, 'English approach content is required'),
  approachContentEs: z.string().min(1, 'Spanish approach content is required'),
  servicesTitleEn: z.string().min(1, 'English services title is required'),
  servicesTitleEs: z.string().min(1, 'Spanish services title is required'),
  servicesContentEn: z.string().min(1, 'English services content is required'),
  servicesContentEs: z.string().min(1, 'Spanish services content is required'),
});

export const contentUpdateSchema = contentSchema.partial();

// Email configuration validation schemas
export const emailConfigSchema = z.object({
  smtpHost: z.string().min(1, 'SMTP host is required'),
  smtpPort: z.number().min(1, 'SMTP port must be greater than 0').max(65535, 'SMTP port must be less than 65536'),
  smtpUser: z.string().min(1, 'SMTP user is required'),
  smtpPass: z.string().min(1, 'SMTP password is required'),
  fromEmail: z.string().email('Invalid from email address'),
  fromName: z.string().min(1, 'From name is required'),
});

export const emailConfigUpdateSchema = emailConfigSchema.partial();

// Email template validation schemas
export const emailTemplateSchema = z.object({
  templateKey: z.string().min(1, 'Template key is required'),
  subject: z.string().min(1, 'Subject is required'),
  body: z.string().min(1, 'Body is required'),
  language: z.enum(['en', 'es']).default('en'),
});

export const emailTemplateCreateSchema = emailTemplateSchema;
export const emailTemplateUpdateSchema = emailTemplateSchema.partial();

// Logo settings validation schemas
export const logoSettingsSchema = z.object({
  type: z.enum(['text', 'image']).default('text'),
  text: z.string().min(1, 'Logo text is required when type is text'),
  imageUrl: z.string().url('Invalid image URL').optional(),
});

export const logoSettingsUpdateSchema = logoSettingsSchema.partial();

// SEO validation schemas
export const seoSchema = z.object({
  title: z.string().min(1, 'SEO title is required'),
  description: z.string().min(1, 'SEO description is required'),
  keywords: z.string().min(1, 'SEO keywords are required'),
  ogImage: z.string().url('Invalid OG image URL').optional(),
});

export const seoUpdateSchema = seoSchema.partial();

// Image validation schemas
export const imageSchema = z.object({
  name: z.string().min(1, 'Image name is required'),
  url: z.string().url('Invalid image URL'),
  altText: z.string().optional(),
  category: z.string().default('general'),
});

export const imageCreateSchema = imageSchema;
export const imageUpdateSchema = imageSchema.partial();

// Profile image validation schemas
export const profileImageSchema = z.object({
  key: z.string().min(1, 'Profile image key is required'),
  url: z.string().url('Invalid image URL'),
  altText: z.string().optional(),
});

export const profileImageCreateSchema = profileImageSchema;
export const profileImageUpdateSchema = profileImageSchema.partial();

// Admin user validation schemas
export const adminUserSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  fullName: z.string().min(1, 'Full name is required'),
  role: z.enum(['admin', 'user']).default('admin'),
});

export const adminUserCreateSchema = adminUserSchema;

// Generic response schemas
export const successResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  data: z.any().optional(),
});

export const errorResponseSchema = z.object({
  success: z.boolean().default(false),
  error: z.string(),
  details: z.string().optional(),
  code: z.number().optional(),
});

// Pagination schemas
export const paginationSchema = z.object({
  page: z.number().min(1, 'Page must be greater than 0').default(1),
  limit: z.number().min(1, 'Limit must be greater than 0').max(100, 'Limit must be less than 100').default(20),
  search: z.string().optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

// Filter schemas
export const clientFilterSchema = z.object({
  status: z.enum(['all', 'active', 'inactive', 'pending']).default('all'),
  language: z.enum(['all', 'en', 'es']).default('all'),
  dateFilter: z.enum(['all', 'today', 'week', 'month']).default('all'),
  searchQuery: z.string().optional(),
});

export const scheduleFilterSchema = z.object({
  dayOfWeek: z.string().optional(),
  isAvailable: z.boolean().optional(),
  dateRange: z.object({
    start: z.string().optional(),
    end: z.string().optional(),
  }).optional(),
});

// Export types
// Client type is now imported from @/lib/types
export type ClientCreate = z.infer<typeof clientCreateSchema>;
export type ClientUpdate = z.infer<typeof clientUpdateSchema>;

// Schedule types are now imported from @/lib/types
export type ScheduleCreate = z.infer<typeof scheduleCreateSchema>;
export type ScheduleUpdate = z.infer<typeof scheduleUpdateSchema>;

export type Booking = z.infer<typeof bookingSchema>;
export type BookingCreate = z.infer<typeof bookingCreateSchema>;
export type BookingUpdate = z.infer<typeof bookingUpdateSchema>;

export type Content = z.infer<typeof contentSchema>;
export type ContentUpdate = z.infer<typeof contentUpdateSchema>;

// EmailConfig types are now imported from @/lib/email
export type EmailConfigUpdate = z.infer<typeof emailConfigUpdateSchema>;

// EmailTemplate types are now imported from @/lib/email
export type EmailTemplateCreate = z.infer<typeof emailTemplateCreateSchema>;
export type EmailTemplateUpdate = z.infer<typeof emailTemplateUpdateSchema>;

export type LogoSettings = z.infer<typeof logoSettingsSchema>;
export type LogoSettingsUpdate = z.infer<typeof logoSettingsUpdateSchema>;

export type Seo = z.infer<typeof seoSchema>;
export type SeoUpdate = z.infer<typeof seoUpdateSchema>;

export type Image = z.infer<typeof imageSchema>;
export type ImageCreate = z.infer<typeof imageCreateSchema>;
export type ImageUpdate = z.infer<typeof imageUpdateSchema>;

export type ProfileImage = z.infer<typeof profileImageSchema>;
export type ProfileImageCreate = z.infer<typeof profileImageCreateSchema>;
export type ProfileImageUpdate = z.infer<typeof profileImageUpdateSchema>;

export type AdminUser = z.infer<typeof adminUserSchema>;
export type AdminUserCreate = z.infer<typeof adminUserCreateSchema>;

export type Pagination = z.infer<typeof paginationSchema>;
export type ClientFilter = z.infer<typeof clientFilterSchema>;
export type ScheduleFilter = z.infer<typeof scheduleFilterSchema>;
