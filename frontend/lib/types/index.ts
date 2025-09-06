export type Language = 'en' | 'es';

export interface NavigationItem {
  invitation: string;
  approach: string;
  session: string;
  about: string;
  apply: string;
}

export interface HeroContent {
  title: string;
  subtitle: string;
  scrollDown: string;
}

export interface ApproachItem {
  title: string;
  text: string;
}

export interface ApproachContent {
  title: string;
  items: ApproachItem[];
}

export interface SessionContent {
  title: string;
  price: string;
  description: string;
  deliverables: string[];
  cta: string;
}

export interface AboutContent {
  title: string;
  text: string;
}

export interface FormContent {
  name: string;
  email: string;
  birthDate: string;
  birthTime: string;
  birthPlace: string;
  question: string;
  questionPlaceholder: string;
  submit: string;
  thankYou: string;
}

export interface ApplyContent {
  title: string;
  subtitle: string;
  form: FormContent;
}

export interface Translations {
  nav: NavigationItem;
  hero: HeroContent;
  approach: ApproachContent;
  session: SessionContent;
  about: AboutContent;
  apply: ApplyContent;
}

export interface FormData {
  name: string;
  email: string;
  birthDate: string;
  birthTime: string;
  birthPlace: string;
  question: string;
}

export interface HeaderProps {
  language: Language;
  setLanguage: (lang: Language) => void;
  currentSection: string;
  scrollToSection: (sectionId: string) => void;
  t: Translations;
}

export interface SectionProps {
  t: Translations;
  scrollToSection?: (sectionId: string) => void;
}

// New comprehensive types for the booking management system

export interface Client {
  id: number;
  email: string;
  name: string;
  phone?: string;
  status: 'active' | 'inactive' | 'suspended';
  birthDate: string;
  birthTime?: string;
  birthPlace: string;
  question: string;
  language: 'en' | 'es';
  adminNotes?: string;
  scheduledDate?: string;
  scheduledTime?: string;
  sessionType?: string;
  lastReminderSent?: string;
  lastBooking?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SoulPackage {
  id: number;
  name: string;
  sessionsCount: number;
  sessionDurationId: number;
  currencyId: number;
  packagePrice: number;
  discountPercent?: number;
  packageType: 'individual' | 'group' | 'mixed';
  maxGroupSize?: number;
  description?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  sessionDuration: SessionDuration;
  currency: Currency;
}



export interface Schedule {
  id: number;
  date: string;
  time: string;
  duration: number;
  capacity: number;
  available: boolean;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  sessionDuration: SessionDuration;
}





export interface Currency {
  id: number;
  code: string;
  name: string;
  symbol: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SessionDuration {
  id: number;
  duration: number;
  unit: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Rate {
  id: number;
  currencyId: number;
  sessionDurationId: number;
  sessionType: string;
  basePrice: number;
  groupDiscountPercent?: number;
  minGroupSize?: number;
  maxGroupSize?: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  currency: Currency;
  sessionDuration: SessionDuration;
}

// Payment System Types
export type PaymentMethod = 'cash' | 'bank_transfer' | 'qr_payment' | 'credit_card' | 'crypto' | 'pay_later' | 'stripe';

export type PaymentStatus = 'pending' | 'completed' | 'failed' | 'refunded' | 'cancelled';

export interface PaymentMethodConfig {
  id: number;
  name: string;
  type: PaymentMethod;
  isActive: boolean;
  description?: string;
  icon?: string;
  requiresConfirmation: boolean;
  autoAssignPackage: boolean;
  // Stripe-specific configuration
  stripeConfig?: {
    publishableKey: string;
    secretKey: string;
    webhookSecret: string;
    currency: string;
    supportedCountries: string[];
    automaticTaxes: boolean;
    allowPromotionCodes: boolean;
  };
  createdAt: string;
  updatedAt: string;
}

export interface PaymentRecord {
  id: number;
  clientEmail: string;
  userPackageId?: number;
  groupBookingId?: number;
  sessionUsageId?: number;
  amount: number;
  currencyCode: string;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  transactionId?: string;
  notes?: string;
  paymentDate?: string;
  confirmedAt?: string;
  createdAt: string;
  updatedAt: string;
  client?: Client;
  userPackage?: UserPackage;
  groupBooking?: GroupBooking;
  sessionUsage?: SessionUsage;
}

export interface CreatePaymentRecordData {
  clientEmail: string;
  userPackageId?: number;
  groupBookingId?: number;
  sessionUsageId?: number;
  amount: number;
  currencyCode: string;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  transactionId?: string;
  notes?: string;
  paymentDate?: string;
}

export interface UpdatePaymentRecordData {
  amount?: number;
  currencyCode?: string;
  paymentMethod?: PaymentMethod;
  paymentStatus?: PaymentStatus;
  transactionId?: string;
  notes?: string;
  paymentDate?: string;
  confirmedAt?: string;
}

export interface PaymentFilters {
  clientEmail?: string;
  paymentMethod?: PaymentMethod | 'all';
  paymentStatus?: PaymentStatus | 'all';
  dateFrom?: string;
  dateTo?: string;
  amountMin?: number;
  amountMax?: number;
}

// Enhanced UserPackage with payment info
export interface UserPackage {
  id: number;
  userEmail: string;
  packageId: number;
  sessionsRemaining: number;
  sessionsUsed?: number;
  purchasedAt?: string;
  expiresAt?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  groupSessionsRemaining?: number;
  groupSessionsUsed?: number;
  purchasePrice?: number;
  originalPrice?: number;
  discountApplied?: number;
  paymentMethod?: PaymentMethod;
  paymentStatus: PaymentStatus;
  client: Client;
  package: SoulPackage;
  groupBookings: GroupBooking[];
  sessionUsage: SessionUsage[];
  paymentRecords: PaymentRecord[];
}

// Enhanced GroupBooking with payment info
export interface GroupBooking {
  id: number;
  clientEmail: string;
  userPackageId: number;
  scheduleId: number;
  groupSize: number;
  status: 'confirmed' | 'completed' | 'cancelled' | 'no-show';
  notes?: string;
  sessionDate: string;
  sessionTime: string;
  totalCost?: number;
  paymentStatus: PaymentStatus;
  paymentMethod?: PaymentMethod;
  createdAt: string;
  updatedAt: string;
  client: Client;
  schedule: Schedule;
  userPackage: UserPackage;
  paymentRecords: PaymentRecord[];
}

// Enhanced SessionUsage with payment info
export interface SessionUsage {
  id: number;
  clientEmail: string;
  userPackageId: number;
  sessionDate: string;
  sessionTime: string;
  sessionType: string;
  status: 'confirmed' | 'completed' | 'cancelled' | 'no-show';
  notes?: string;
  cost?: number;
  paymentStatus: PaymentStatus;
  paymentMethod?: PaymentMethod;
  createdAt: string;
  updatedAt: string;
  client: Client;
  userPackage: UserPackage;
  paymentRecords: PaymentRecord[];
}

// Booking form data types
export interface CreateBookingData {
  clientEmail: string;
  userPackageId: number;
  scheduleId: number;
  sessionDate: string;
  sessionTime: string;
  sessionType: 'individual' | 'group';
  groupSize?: number;
  notes?: string;
  paymentMethod?: PaymentMethod;
  paymentStatus?: PaymentStatus;
}

export interface UpdateBookingData {
  id: number;
  status?: 'confirmed' | 'completed' | 'cancelled' | 'no-show';
  notes?: string;
  groupSize?: number;
  paymentMethod?: PaymentMethod;
  paymentStatus?: PaymentStatus;
}

// Filter types
export interface BookingFilters {
  clientEmail?: string;
  status?: 'all' | 'confirmed' | 'completed' | 'cancelled' | 'no-show';
  dateFrom?: string;
  dateTo?: string;
  packageType?: 'all' | 'individual' | 'group' | 'mixed';
  sessionType?: 'all' | 'individual' | 'group';
}

export interface ClientFilters {
  email?: string;
  status?: string;
  language?: string;
  hasActivePackages?: boolean;
}

// API response types - imported from @/lib/api

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Modal types
export interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: 'create' | 'edit' | 'view';
  booking?: GroupBooking | SessionUsage;
  clients?: Client[];
  userPackages?: UserPackage[];
  schedules?: Schedule[];
  onSubmit: (data: CreateBookingData) => void;
}

export interface ClientModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: 'create' | 'edit' | 'view';
  client?: Client;
}

export interface PackageAssignmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  client: Client;
  availablePackages: SoulPackage[];
  onAssign: (packageId: number, quantity: number) => void;
}