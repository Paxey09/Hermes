const runtimeConfig = {
  pageId: "",
  pageName: "",
  pageAccessToken: "",
  verifyToken: "",
  appSecret: "",
};

function getConfig() {
  return {
    pageId: runtimeConfig.pageId || process.env.FB_PAGE_ID || "",
    pageName: runtimeConfig.pageName || process.env.FB_PAGE_NAME || "",
    pageAccessToken: runtimeConfig.pageAccessToken || process.env.FB_PAGE_ACCESS_TOKEN || "",
    verifyToken: runtimeConfig.verifyToken || process.env.FB_VERIFY_TOKEN || "",
    appSecret: runtimeConfig.appSecret || process.env.FB_APP_SECRET || "",
  };
}

function saveConfig(payload = {}) {
  if (typeof payload.pageId === "string") runtimeConfig.pageId = payload.pageId.trim();
  if (typeof payload.pageName === "string") runtimeConfig.pageName = payload.pageName.trim();
  if (typeof payload.pageAccessToken === "string") runtimeConfig.pageAccessToken = payload.pageAccessToken.trim();
  if (typeof payload.verifyToken === "string") runtimeConfig.verifyToken = payload.verifyToken.trim();
  if (typeof payload.appSecret === "string") runtimeConfig.appSecret = payload.appSecret.trim();
}

function getBaseUrl(req) {
  const configured =
    process.env.PUBLIC_BASE_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "");

  if (configured) {
    return configured.replace(/\/$/, "");
  }

  const host = req.headers.host || "localhost:3000";
  const proto = req.headers["x-forwarded-proto"] || "https";
  return `${proto}://${host}`;
}

function buildStatus(req) {
  const config = getConfig();

  return {
    connected: Boolean(config.pageAccessToken && config.verifyToken),
    pageId: config.pageId || null,
    pageName: config.pageName || null,
    hasPageAccessToken: Boolean(config.pageAccessToken),
    hasVerifyToken: Boolean(config.verifyToken),
    hasAppSecret: Boolean(config.appSecret),
    verifyToken: config.verifyToken || null,
    pageAccessTokenMasked: config.pageAccessToken ? `${config.pageAccessToken.slice(0, 4)}••••••••` : null,
    webhookUrl: `${getBaseUrl(req)}/api/webhooks/facebook`,
    note: "Credentials set from this panel are runtime-only. Add FB_* environment variables for persistence.",
  };
}

export default function handler(req, res) {
  res.setHeader("Access-Control-Allow-Credentials", true);
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS,POST");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method === "GET") {
    return res.status(200).json(buildStatus(req));
  }

  if (req.method === "POST") {
    const { action, pageId, pageName, pageAccessToken, verifyToken, appSecret } = req.body || {};

    if (action !== "connect") {
      return res.status(400).json({ error: "Unsupported action" });
    }

    if (!pageAccessToken || !verifyToken) {
      return res.status(400).json({ error: "pageAccessToken and verifyToken are required" });
    }

    saveConfig({ pageId, pageName, pageAccessToken, verifyToken, appSecret });

    return res.status(200).json({
      success: true,
      ...buildStatus(req),
      note: "Connection saved for current runtime. Add FB_* env vars to keep this after restart/redeploy.",
    });
  }

  return res.status(405).json({ error: "Method not allowed" });
}