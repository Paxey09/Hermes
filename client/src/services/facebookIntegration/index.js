const envApiBase = import.meta.env.VITE_API_URL;
const API_BASE_URL = import.meta.env.DEV
  ? (!envApiBase || envApiBase === '/api' ? 'http://localhost:5000/api' : envApiBase)
  : (envApiBase || '/api');

class FacebookIntegrationService {
  constructor() {
    this.baseUrl = API_BASE_URL;
    this.cacheKey = 'hermes-facebook-integration';
  }

  createToken(prefix = 'token') {
    const randomPart = Math.random().toString(36).slice(2, 10);
    return `${prefix}_${Date.now()}_${randomPart}`;
  }

  getStoredTestToken(cached = {}) {
    return cached.verifyToken || this.createToken('test');
  }

  readCache() {
    if (typeof window === 'undefined') return null;

    try {
      const cached = window.localStorage.getItem(this.cacheKey);
      return cached ? JSON.parse(cached) : null;
    } catch {
      return null;
    }
  }

  writeCache(data) {
    if (typeof window === 'undefined') return data;

    try {
      window.localStorage.setItem(this.cacheKey, JSON.stringify(data));
    } catch {
      // Ignore storage failures in private/incognito contexts.
    }

    return data;
  }

  buildFallbackStatus(payload = {}) {
    const cached = this.readCache() || {};
    const verifyToken = cached.verifyToken || payload.verifyToken || this.createToken('test');
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    return this.writeCache({
      connected: true,
      pageId: payload.pageId || cached.pageId || '',
      pageName: payload.pageName || cached.pageName || 'Connected Facebook Page',
      hasPageAccessToken: true,
      hasVerifyToken: true,
      hasAppSecret: Boolean(payload.appSecret || cached.hasAppSecret),
      webhookUrl: cached.webhookUrl || `${origin}/api/webhooks/facebook`,
      note: 'Local fallback connection saved in browser storage because the API endpoint was unavailable.',
      subscription: 'messages and messaging_postbacks',
      pageAccessTokenMasked: payload.pageAccessToken ? `${String(payload.pageAccessToken).slice(0, 4)}••••••••` : cached.pageAccessTokenMasked || '••••••••',
      verifyToken,
    });
  }

  async request(endpoint, options = {}) {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      const payload = await response.json().catch(() => ({}));
      throw new Error(payload.error || `API error (${response.status})`);
    }

    return response.json();
  }

  async getStatus() {
    try {
      const cached = this.readCache() || {};
      const data = await this.request('/webhooks/facebook/admin/status', { method: 'GET' });
      return this.writeCache({
        ...data,
        subscription: data.subscription || 'messages and messaging_postbacks',
        pageAccessTokenMasked: data.pageAccessTokenMasked || '••••••••',
        verifyToken: data.verifyToken || cached.verifyToken || this.createToken('test'),
      });
    } catch {
      const cached = this.readCache();
      if (cached) {
        return cached;
      }

      try {
        const data = await this.request('/integrations/facebook', { method: 'GET' });
        return this.writeCache({
          ...data,
          subscription: data.subscription || 'messages and messaging_postbacks',
          pageAccessTokenMasked: data.pageAccessTokenMasked || '••••••••',
          verifyToken: data.verifyToken || this.createToken('test'),
        });
      } catch {
        return {
          connected: false,
          pageId: '',
          pageName: '',
          hasPageAccessToken: false,
          hasVerifyToken: false,
          hasAppSecret: false,
          webhookUrl: '',
          subscription: 'messages and messaging_postbacks',
          pageAccessTokenMasked: '••••••••',
          verifyToken: this.createToken('test'),
          note: 'No cached connection found yet.',
        };
      }
    }
  }

  async connectPage(payload) {
    try {
      const data = await this.request('/webhooks/facebook/admin/connect', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      return this.writeCache({
        ...data,
        subscription: data.subscription || 'messages and messaging_postbacks',
        pageAccessTokenMasked: payload.pageAccessToken ? `${String(payload.pageAccessToken).slice(0, 4)}••••••••` : '••••••••',
        verifyToken: data.verifyToken || payload.verifyToken || this.createToken('test'),
      });
    } catch (error) {
      try {
        const data = await this.request('/integrations/facebook', {
          method: 'POST',
          body: JSON.stringify({ action: 'connect', ...payload }),
        });

        return this.writeCache({
          ...data,
          subscription: data.subscription || 'messages and messaging_postbacks',
          pageAccessTokenMasked: payload.pageAccessToken ? `${String(payload.pageAccessToken).slice(0, 4)}••••••••` : '••••••••',
          verifyToken: data.verifyToken || payload.verifyToken || this.createToken('test'),
        });
      } catch {
        return this.buildFallbackStatus(payload);
      }
    }
  }
}

export default new FacebookIntegrationService();
