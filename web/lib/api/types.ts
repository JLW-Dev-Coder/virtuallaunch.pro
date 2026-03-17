// ---------------------------------------------------------------------------
// API response types — shapes mirror the canonical contracts in /contracts/
// Update these types as contracts evolve; do NOT invent fields.
// ---------------------------------------------------------------------------

export interface DashboardSummary {
  tokensRemaining: number
  tokensTotal: number
  upcomingBookings: number
  openTickets: number
  membership: string
  renewalDate: string
}

export interface AccountProfile {
  accountId: string
  email: string
  firstName: string
  lastName: string
  phone?: string
  timezone?: string
  status: 'active' | 'archived' | 'disabled' | 'pending'
  platform: 'tmp' | 'ttmp' | 'tttmp' | 'vlp'
  role: 'admin' | 'member' | 'professional' | 'taxpayer'
  twoFactorEnabled: boolean
  createdAt: string
}

export interface NotificationPreferences {
  accountId: string
  inAppEnabled: boolean
  smsEnabled: boolean
}

export interface VlpPreferences {
  accountId: string
  appearance: 'dark' | 'light' | 'system'
  timezone?: string
  defaultDashboard?: string
  accentColor?: string
}

export interface Booking {
  bookingId: string
  accountId: string
  professionalId: string
  bookingType: 'demo_intro' | 'support'
  scheduledAt: string
  timezone: string
  status: 'cancelled' | 'completed' | 'confirmed' | 'pending' | 'rescheduled'
}

export interface Receipt {
  invoiceId: string
  accountId: string
  amount: number
  currency: string
  status: string
  createdAt: string
  receiptUrl?: string
}

export interface SupportTicket {
  ticketId: string
  accountId: string
  subject: string
  message: string
  priority: 'high' | 'low' | 'normal' | 'urgent'
  status: 'closed' | 'in_progress' | 'open' | 'reopened' | 'resolved'
  createdAt: string
}

export interface TokenBalance {
  accountId: string
  taxGameTokens: number
  transcriptTokens: number
  updatedAt: string
}

export interface TokenUsageEntry {
  eventId: string
  accountId: string
  tokenType: 'tax_game' | 'transcript'
  amount: number
  action: string
  createdAt: string
}

export interface ApiError {
  code: string
  message: string
}

export type ApiResult<T> = { ok: true; data: T } | { ok: false; error: ApiError }
