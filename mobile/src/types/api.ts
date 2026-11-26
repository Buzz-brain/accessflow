export type FeedbackType = 'success' | 'error' | 'info';

export interface AccessibilityFeedback {
  announce: boolean;
  type: FeedbackType;
  announcement: string;
  priority?: 'high';
}

export interface ApiSuccess<T> {
  success: true;
  message: string;
  accessibilityFeedback?: AccessibilityFeedback;
  data?: T;
  meta?: PaginationMeta;
}

export interface ApiErrorPayload {
  success: false;
  message: string;
  code: string;
  details?: { field: string; message: string; value?: unknown }[];
  accessibilityFeedback?: AccessibilityFeedback;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage?: boolean;
  hasPreviousPage?: boolean;
}

export interface ValidationIssue {
  field: string;
  message: string;
}
