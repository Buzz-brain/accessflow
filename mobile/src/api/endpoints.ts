export const endpoints = {
  health: '/health',
  auth: {
    register: '/api/v1/auth/register',
    login: '/api/v1/auth/login',
    me: '/api/v1/auth/me'
  },
  accounts: {
    me: '/api/v1/accounts/me',
    balance: '/api/v1/accounts/me/balance',
    lookupRecipient: (accountNumber: string) => `/api/v1/accounts/lookup/${accountNumber}`
  },
  transactions: {
    list: '/api/v1/transactions',
    detail: (id: string) => `/api/v1/transactions/${id}`,
    review: '/api/v1/transactions/transfer/review',
    confirm: (id: string) => `/api/v1/transactions/${id}/confirm`,
    cancel: (id: string) => `/api/v1/transactions/${id}/cancel`
  },
  accessibility: {
    preferences: '/api/v1/accessibility/preferences',
    reset: '/api/v1/accessibility/preferences/reset'
  },
  mam: {
    dimensions: '/api/v1/mam/dimensions',
    criteria: '/api/v1/mam/criteria',
    weights: '/api/v1/mam/weights'
  },
  evaluation: {
    tasks: '/api/v1/evaluation/tasks'
  }
} as const;
