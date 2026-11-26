const configured = process.env.EXPO_PUBLIC_API_URL?.trim();

export const API_BASE_URL = (configured || 'http://localhost:5000').replace(/\/+$/, '');

export const API_TIMEOUT_MS = 15000;
