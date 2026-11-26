export type UserRole = 'user' | 'admin';

export interface SafeUser {
  id: string;
  fullName: string;
  email: string;
  phoneNumber: string;
  role: UserRole;
  isActive: boolean;
  createdAt: string;
}

export interface Account {
  id: string;
  accountNumber: string;
  accountName: string;
  bankName: string;
  accountType: 'savings' | 'current';
  currency: string;
  balance: number;
  balanceKobo: number;
}

export interface BalanceSummary {
  accountNumber: string;
  accountName: string;
  bankName: string;
  currency: string;
  balance: number;
  balanceKobo: number;
}

export type TransactionType = 'transfer' | 'deposit' | 'withdrawal';
export type TransactionStatus =
  | 'initiated'
  | 'pending_confirmation'
  | 'confirmed'
  | 'processing'
  | 'successful'
  | 'failed'
  | 'cancelled';
export type ConfirmationStatus = 'not_required' | 'pending' | 'confirmed' | 'rejected';
export type TransactionDirection = 'debit' | 'credit';

export interface Transaction {
  id: string;
  reference: string;
  transactionType: TransactionType;
  amount: number;
  amountKobo: number;
  narration: string;
  status: TransactionStatus;
  confirmationStatus: ConfirmationStatus;
  previousBalance: number | null;
  previousBalanceKobo: number | null;
  newBalance: number | null;
  newBalanceKobo: number | null;
  failureReason: string | null;
  confirmedAt: string | null;
  createdAt: string;
  updatedAt: string;
  direction?: TransactionDirection;
}

export type GestureSensitivity = 'low' | 'medium' | 'high';
export type AccessibilityMode =
  | 'balanced'
  | 'voice_first'
  | 'vibration_first'
  | 'high_contrast'
  | 'simplified';

export interface AccessibilityPreferences {
  voiceGuidanceEnabled: boolean;
  voiceSpeed: number;
  vibrationEnabled: boolean;
  vibrationIntensity: number;
  gestureSensitivity: GestureSensitivity;
  privacyMode: boolean;
  highContrastEnabled: boolean;
  textScale: number;
  simplifiedNavigation: boolean;
  preferredAccessibilityMode: AccessibilityMode;
  updatedAt: string;
}

export type PreferenceUpdate = Partial<Omit<AccessibilityPreferences, 'updatedAt'>>;

export interface TransferReview {
  recipientName: string;
  recipientAccountNumber: string;
  senderName: string;
  senderAccountNumber: string;
  amount: number;
  amountKobo: number;
  narration: string;
  reference: string;
  status: TransactionStatus;
  confirmationInstructions: string;
}

export interface TransferReviewData {
  transaction: Transaction;
  review: TransferReview;
}

export interface Criterion {
  id: string;
  name: string;
  code: string;
  dimensionCode: DimensionCode;
  description: string;
  assessmentInstructions: string;
  assessmentMethod: string;
  maximumScore: number;
  isActive: boolean;
}

export type DimensionCode = 'P' | 'O' | 'C' | 'S' | 'A';

export interface Dimension {
  id: string;
  name: string;
  code: DimensionCode;
  description: string;
  weight: number;
  isActive: boolean;
  criteriaCount: number;
  criteria?: Criterion[];
}

export interface EvaluationTask {
  id: string;
  taskName: string;
  description: string;
  taskCode: string;
  isActive: boolean;
}
