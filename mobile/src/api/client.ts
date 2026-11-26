import { create, isCancel, type AxiosError, type InternalAxiosRequestConfig } from 'axios';
import { API_BASE_URL, API_TIMEOUT_MS } from './config';
import { getAuthToken } from '@/src/services/storage/tokenStorage';
import type { AccessibilityFeedback, ApiErrorPayload, ApiSuccess } from '@/src/types/api';

type UnauthorizedHandler = () => void;
let unauthorizedHandler: UnauthorizedHandler | null = null;

export function setUnauthorizedHandler(handler: UnauthorizedHandler | null) {
  unauthorizedHandler = handler;
}

export class ApiError extends Error {
  status: number;
  code: string;
  details: ApiErrorPayload['details'];
  feedback?: AccessibilityFeedback;
  payload?: ApiErrorPayload;

  constructor(payload: ApiErrorPayload, status: number) {
    super(payload.message || 'Something went wrong');
    this.name = 'ApiError';
    this.status = status;
    this.code = payload.code || 'UNKNOWN_ERROR';
    this.details = payload.details;
    this.feedback = payload.accessibilityFeedback;
    this.payload = payload;
  }
}

export const api = create({
  baseURL: API_BASE_URL,
  timeout: API_TIMEOUT_MS,
  headers: { 'Content-Type': 'application/json', Accept: 'application/json' }
});

api.interceptors.request.use(async (config: InternalAxiosRequestConfig) => {
  const token = await getAuthToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error: unknown) => {
    if (isCancel(error)) return Promise.reject(error);

    const axiosError = error as AxiosError<ApiErrorPayload>;
    if (!axiosError.response) {
      const timeout = axiosError.code === 'ECONNABORTED';
      const payload: ApiErrorPayload = {
        success: false,
        code: timeout ? 'TIMEOUT' : 'NETWORK_ERROR',
        message: timeout
          ? 'The request took too long. Check your connection and try again.'
          : 'Unable to connect to AccessFlow. Check your internet connection and try again.',
        accessibilityFeedback: {
          announce: true,
          type: 'error',
          announcement: timeout
            ? 'The request took too long. Check your connection and try again.'
            : 'Unable to connect. Check your internet connection and try again.'
        }
      };
      return Promise.reject(new ApiError(payload, 0));
    }

    const status = axiosError.response.status;
    const payload = axiosError.response.data ?? {
      success: false as const,
      code: 'UNKNOWN_ERROR',
      message: 'Unable to complete this request.'
    };

    if (status === 401 && payload.code === 'UNAUTHORIZED') {
      unauthorizedHandler?.();
    }

    return Promise.reject(new ApiError(payload, status));
  }
);

export async function apiGet<T>(url: string, params?: Record<string, string | number | boolean | undefined>) {
  const response = await api.get<ApiSuccess<T>>(url, { params });
  return response.data;
}

export async function apiPost<T>(url: string, body?: unknown, headers?: Record<string, string>) {
  const response = await api.post<ApiSuccess<T>>(url, body, { headers });
  return response.data;
}

export async function apiPut<T>(url: string, body?: unknown) {
  const response = await api.put<ApiSuccess<T>>(url, body);
  return response.data;
}

export function toApiError(error: unknown): ApiError {
  if (error instanceof ApiError) return error;
  return new ApiError(
    {
      success: false,
      code: 'UNKNOWN_ERROR',
      message: error instanceof Error ? error.message : 'Something went wrong'
    },
    0
  );
}
