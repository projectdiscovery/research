import axios from 'axios'

const api = axios.create({
  baseURL: '/api/v1',
  headers: { 'Content-Type': 'application/json' },
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('vaultbank_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

let isRefreshing = false
let refreshSubscribers = []

function subscribeTokenRefresh(cb) {
  refreshSubscribers.push(cb)
}

function onRefreshed(token) {
  refreshSubscribers.forEach((cb) => cb(token))
  refreshSubscribers = []
}

api.interceptors.response.use(
  (res) => res,
  async (err) => {
    const originalRequest = err.config
    if (err.response?.status === 401 && !originalRequest._retry) {
      // Skip refresh loop for refresh endpoint itself
      if (originalRequest.url?.includes('/auth/refresh')) {
        localStorage.removeItem('vaultbank_token')
        localStorage.removeItem('vaultbank_refresh')
        localStorage.removeItem('vaultbank_user')
        window.location.href = '/login'
        return Promise.reject(err)
      }

      if (isRefreshing) {
        return new Promise((resolve) => {
          subscribeTokenRefresh((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`
            resolve(api(originalRequest))
          })
        })
      }

      originalRequest._retry = true
      isRefreshing = true

      const refreshToken = localStorage.getItem('vaultbank_refresh')
      if (!refreshToken) {
        isRefreshing = false
        localStorage.removeItem('vaultbank_token')
        localStorage.removeItem('vaultbank_user')
        window.location.href = '/login'
        return Promise.reject(err)
      }

      try {
        const res = await axios.post('/api/v1/auth/refresh', {
          refresh_token: refreshToken,
        })
        const { access_token, refresh_token: newRefresh } = res.data
        localStorage.setItem('vaultbank_token', access_token)
        localStorage.setItem('vaultbank_refresh', newRefresh)
        if (res.data.user) {
          localStorage.setItem('vaultbank_user', JSON.stringify(res.data.user))
        }
        onRefreshed(access_token)
        isRefreshing = false
        originalRequest.headers.Authorization = `Bearer ${access_token}`
        return api(originalRequest)
      } catch (refreshErr) {
        isRefreshing = false
        localStorage.removeItem('vaultbank_token')
        localStorage.removeItem('vaultbank_refresh')
        localStorage.removeItem('vaultbank_user')
        window.location.href = '/login'
        return Promise.reject(refreshErr)
      }
    }
    return Promise.reject(err)
  }
)

export const authApi = {
  login: (data) => api.post('/auth/login', data),
  register: (data) => api.post('/auth/register', data),
  me: () => api.get('/auth/me'),
  updateMe: (data) => api.put('/auth/me', data),
  refresh: (refreshToken) => api.post('/auth/refresh', { refresh_token: refreshToken }),
  logout: (refreshToken) => api.post('/auth/logout', { refresh_token: refreshToken }),
}

export const accountsApi = {
  list: () => api.get('/accounts/'),
  get: (id) => api.get(`/accounts/${id}`),
  create: (data) => api.post('/accounts/', data),
}

export const transactionsApi = {
  list: (params) => api.get('/transactions/', { params }),
  transfer: (data) => api.post('/transactions/transfer', data),
  deposit: (accountId, amount, description) =>
    api.post(`/transactions/deposit/${accountId}`, null, {
      params: { amount, description },
    }),
  billPay: (data) => api.post('/transactions/bill-pay', data),
}

export const loansApi = {
  list: () => api.get('/loans/'),
  apply: (data) => api.post('/loans/', data),
}

export const beneficiariesApi = {
  list: () => api.get('/beneficiaries/'),
  create: (data) => api.post('/beneficiaries/', data),
  delete: (id) => api.delete(`/beneficiaries/${id}`),
}

export const notificationsApi = {
  list: (params) => api.get('/notifications', { params }),
  markRead: (id) => api.patch(`/notifications/${id}/read`),
  markAllRead: () => api.patch('/notifications/read-all'),
}

export const statementsApi = {
  downloadPdf: (accountId, params) =>
    api.get(`/statements/${accountId}/pdf`, { params, responseType: 'blob' }),
}

export const adminApi = {
  getUsers: (params) => api.get('/admin/users', { params }),
  updateRole: (id, data) => api.patch(`/admin/users/${id}/role`, data),
  toggleActive: (id) => api.patch(`/admin/users/${id}/activate`),
  getBranches: () => api.get('/admin/branches'),
  createBranch: (data) => api.post('/admin/branches', data),
  getSettings: () => api.get('/admin/settings'),
  updateSettings: (settings) => api.patch('/admin/settings', { settings }),
  getAnalytics: () => api.get('/admin/analytics'),
}

export const tellerApi = {
  searchCustomers: (q) => api.get('/teller/customers/search', { params: { q } }),
  getCustomerAccounts: (userId) => api.get(`/teller/customers/${userId}/accounts`),
  getCustomerTransactions: (userId, params) =>
    api.get(`/teller/customers/${userId}/transactions`, { params }),
  deposit: (data) => api.post('/teller/deposit', data),
  withdraw: (data) => api.post('/teller/withdrawal', data),
  transfer: (data) => api.post('/teller/transfer', data),
}

export const managerApi = {
  getApprovals: () => api.get('/manager/approvals'),
  approve: (id) => api.post(`/manager/approvals/${id}/approve`),
  reject: (id, reason) => api.post(`/manager/approvals/${id}/reject`, { reason }),
  getAnalytics: () => api.get('/manager/analytics'),
  freezeAccount: (id, reason) => api.post(`/manager/accounts/${id}/freeze`, { reason }),
  unfreezeAccount: (id) => api.post(`/manager/accounts/${id}/unfreeze`),
  getTellers: () => api.get('/manager/tellers'),
  searchAccounts: (q) => api.get('/manager/accounts/search', { params: { q } }),
}

export const complianceApi = {
  getTransactions: (params) => api.get('/compliance/transactions', { params }),
  flagTransaction: (id, reason) =>
    api.post(`/compliance/transactions/${id}/flag`, { reason }),
  unflagTransaction: (id) => api.delete(`/compliance/transactions/${id}/flag`),
  placeHold: (id, reason) => api.post(`/compliance/accounts/${id}/hold`, { reason }),
  removeHold: (id) => api.delete(`/compliance/accounts/${id}/hold`),
  getAuditTrail: (params) => api.get('/compliance/audit-trail', { params }),
  getSuspiciousReport: () => api.get('/compliance/reports/suspicious'),
}

export const loanApplicationsApi = {
  apply: (data) => api.post('/loan-applications/', data),
  myApplications: () => api.get('/loan-applications/my'),
  getPending: () => api.get('/loan-applications/pending'),
  getAll: (params) => api.get('/loan-applications/all', { params }),
  getComplianceQueue: () => api.get('/loan-applications/compliance-queue'),
  managerReview: (id, data) => api.post(`/loan-applications/${id}/manager-review`, data),
  complianceReview: (id, data) => api.post(`/loan-applications/${id}/compliance-review`, data),
  disburse: (id, data) => api.post(`/loan-applications/${id}/disburse`, data),
}

export const scheduledPaymentsApi = {
  list: () => api.get('/scheduled-payments/'),
  create: (data) => api.post('/scheduled-payments/', data),
  update: (id, data) => api.patch(`/scheduled-payments/${id}`, data),
  delete: (id) => api.delete(`/scheduled-payments/${id}`),
}

export const currencyApi = {
  getRates: () => api.get('/currency/rates'),
  getSupported: () => api.get('/currency/supported'),
  getQuote: (params) => api.get('/currency/quote', { params }),
  convert: (data) => api.post('/currency/convert', data),
  upsertRate: (data) => api.post('/currency/rates', data),
}

export const disputesApi = {
  file: (data) => api.post('/disputes/', data),
  myDisputes: () => api.get('/disputes/my'),
  allDisputes: (params) => api.get('/disputes/', { params }),
  uploadEvidence: (id, formData) =>
    api.post(`/disputes/${id}/evidence`, formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  review: (id, data) => api.post(`/disputes/${id}/review`, data),
}

export const analyticsApi = {
  spendingBreakdown: (params) => api.get('/analytics/spending', { params }),
  monthlyTrends: (params) => api.get('/analytics/monthly-trends', { params }),
  summary: () => api.get('/analytics/summary'),
  system: () => api.get('/analytics/system'),
}

export const sessionsApi = {
  list: () => api.get('/sessions/'),
  revoke: (id) => api.delete(`/sessions/${id}`),
  revokeAll: () => api.delete('/sessions/'),
}

export default api
