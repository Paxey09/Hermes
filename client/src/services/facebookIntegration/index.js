const envApiBase = import.meta.env.VITE_API_URL;
const API_BASE_URL = import.meta.env.DEV
  ? (!envApiBase || envApiBase === "/api" ? "http://localhost:5000/api" : envApiBase)
  : (envApiBase || "/api");

class FacebookIntegrationService {
  constructor() {
    this.baseUrl = API_BASE_URL;
    this.cacheKey = "hermes-facebook-integration";
  }

  createToken(prefix = "token") {
    const randomPart = Math.random().toString(36).slice(2, 10);
    return `${prefix}_${Date.now()}_${randomPart}`;
  }

  getStoredTestToken(cached = {}) {
    return cached.verifyToken || this.createToken("test");
  }

  readCache() {
    if (typeof window === "undefined") return null;

    try {
      const cached = window.localStorage.getItem(this.cacheKey);
      return cached ? JSON.parse(cached) : null;
    } catch {
      return null;
    }
  }

  writeCache(data) {
    if (typeof window === "undefined") return data;

    try {
      window.localStorage.setItem(this.cacheKey, JSON.stringify(data));
    } catch {
      // Ignore storage failures in private/incognito contexts.
    }

    return data;
  }

  buildFallbackStatus(payload = {}) {
    const cached = this.readCache() || {};
    const verifyToken = cached.verifyToken || payload.verifyToken || this.createToken("test");
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    return this.writeCache({
      connected: true,
      pageId: payload.pageId || cached.pageId || "",
      pageName: payload.pageName || cached.pageName || "Connected Facebook Page",
      businessType: payload.businessType || cached.businessType || "",
      productServices: payload.productServices || cached.productServices || "",
      productServicePriceRanges: payload.productServicePriceRanges || cached.productServicePriceRanges || "",
      websiteLink: payload.websiteLink || cached.websiteLink || "",
      shoppeLink: payload.shoppeLink || cached.shoppeLink || "",
      lazadaLink: payload.lazadaLink || cached.lazadaLink || "",
      accessMode: payload.accessMode || cached.accessMode || "enable",
      hasPageAccessToken: true,
      hasVerifyToken: true,
      hasAppSecret: Boolean(payload.appSecret || cached.hasAppSecret),
      webhookUrl: cached.webhookUrl || `${origin}/api/webhooks/facebook`,
      note: "Local fallback connection saved in browser storage because the API endpoint was unavailable.",
      subscription: "messages and messaging_postbacks",
      pageAccessTokenMasked: payload.pageAccessToken ? `${String(payload.pageAccessToken).slice(0, 4)}********` : cached.pageAccessTokenMasked || "********",
      verifyToken,
      connectedPages: Array.isArray(cached.connectedPages)
        ? cached.connectedPages
        : [
            {
              pageId: payload.pageId || cached.pageId || "",
              pageName: payload.pageName || cached.pageName || "Connected Facebook Page",
              businessType: payload.businessType || cached.businessType || "",
              productServices: payload.productServices || cached.productServices || "",
              productServicePriceRanges: payload.productServicePriceRanges || cached.productServicePriceRanges || "",
              websiteLink: payload.websiteLink || cached.websiteLink || "",
              shoppeLink: payload.shoppeLink || cached.shoppeLink || "",
              lazadaLink: payload.lazadaLink || cached.lazadaLink || "",
              accessMode: payload.accessMode || cached.accessMode || "enable",
              pageAccessTokenMasked: payload.pageAccessToken
                ? `${String(payload.pageAccessToken).slice(0, 4)}********`
                : cached.pageAccessTokenMasked || "********",
            },
          ],
    });
  }

  async request(endpoint, options = {}) {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
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
      const data = await this.request("/webhooks/facebook/admin/status", { method: "GET" });
      return this.writeCache({
        ...data,
        subscription: data.subscription || "messages and messaging_postbacks",
        pageAccessTokenMasked: data.pageAccessTokenMasked || "********",
        verifyToken: data.verifyToken || cached.verifyToken || this.createToken("test"),
      });
    } catch {
      const cached = this.readCache();
      if (cached) {
        return cached;
      }

      try {
        const data = await this.request("/integrations/facebook", { method: "GET" });
        return this.writeCache({
          ...data,
          subscription: data.subscription || "messages and messaging_postbacks",
          pageAccessTokenMasked: data.pageAccessTokenMasked || "********",
          verifyToken: data.verifyToken || this.createToken("test"),
        });
      } catch {
        return {
          connected: false,
          pageId: "",
          pageName: "",
          businessType: "",
          productServices: "",
          productServicePriceRanges: "",
          websiteLink: "",
          shoppeLink: "",
          lazadaLink: "",
          accessMode: "enable",
          hasPageAccessToken: false,
          hasVerifyToken: false,
          hasAppSecret: false,
          webhookUrl: "",
          subscription: "messages and messaging_postbacks",
          pageAccessTokenMasked: "********",
          verifyToken: this.createToken("test"),
          connectedPages: [],
          note: "No cached connection found yet.",
        };
      }
    }
  }

  async connectPage(payload) {
    try {
      const data = await this.request("/webhooks/facebook/admin/connect", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      return this.writeCache({
        ...data,
        accessMode: data.accessMode || payload.accessMode || "enable",
        subscription: data.subscription || "messages and messaging_postbacks",
        pageAccessTokenMasked: payload.pageAccessToken ? `${String(payload.pageAccessToken).slice(0, 4)}********` : "********",
        verifyToken: data.verifyToken || payload.verifyToken || this.createToken("test"),
      });
    } catch (primaryError) {
      try {
        const data = await this.request("/integrations/facebook", {
          method: "POST",
          body: JSON.stringify({ action: "connect", ...payload }),
        });

        return this.writeCache({
          ...data,
          accessMode: data.accessMode || payload.accessMode || "enable",
          subscription: data.subscription || "messages and messaging_postbacks",
          pageAccessTokenMasked: payload.pageAccessToken ? `${String(payload.pageAccessToken).slice(0, 4)}********` : "********",
          verifyToken: data.verifyToken || payload.verifyToken || this.createToken("test"),
        });
      } catch (fallbackError) {
        const primaryMessage = primaryError?.message || "Primary connect endpoint failed.";
        const fallbackMessage = fallbackError?.message || "Fallback connect endpoint failed.";
        throw new Error(`${primaryMessage} ${fallbackMessage}`.trim());
      }
    }
  }

  async updateAccessMode(pageId, accessMode) {
    try {
      const data = await this.request("/webhooks/facebook/admin/access-mode", {
        method: "POST",
        body: JSON.stringify({ pageId, accessMode }),
      });

      return this.writeCache({
        ...data,
        accessMode: data.accessMode || "enable",
      });
    } catch (primaryError) {
      try {
        const data = await this.request("/integrations/facebook", {
          method: "POST",
          body: JSON.stringify({ action: "updateAccessMode", pageId, accessMode }),
        });

        return this.writeCache({
          ...data,
          accessMode: data.accessMode || "enable",
        });
      } catch (fallbackError) {
        const primaryMessage = primaryError?.message || "Primary access mode endpoint failed.";
        const fallbackMessage = fallbackError?.message || "Fallback access mode endpoint failed.";
        throw new Error(`${primaryMessage} ${fallbackMessage}`.trim());
      }
    }
  }

  async updatePageDetails(pageId, payload = {}) {
    try {
      const data = await this.request("/webhooks/facebook/admin/page-details", {
        method: "POST",
        body: JSON.stringify({ pageId, ...payload }),
      });

      return this.writeCache({
        ...data,
      });
    } catch (primaryError) {
      try {
        const data = await this.request("/integrations/facebook", {
          method: "POST",
          body: JSON.stringify({ action: "updatePageDetails", pageId, ...payload }),
        });

        return this.writeCache({
          ...data,
        });
      } catch (fallbackError) {
        const primaryMessage = primaryError?.message || "Primary page details endpoint failed.";
        const fallbackMessage = fallbackError?.message || "Fallback page details endpoint failed.";
        throw new Error(`${primaryMessage} ${fallbackMessage}`.trim());
      }
    }
  }
}

export default new FacebookIntegrationService();
