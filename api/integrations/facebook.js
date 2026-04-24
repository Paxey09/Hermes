import { createClient } from "@supabase/supabase-js";

const runtimeConfig = {
  pageId: "",
  pageName: "",
  pageAccessToken: "",
  verifyToken: "",
  appSecret: "",
};

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServerKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
const supabaseClient = supabaseUrl && supabaseServerKey ? createClient(supabaseUrl, supabaseServerKey) : null;

function getNormalizedSupabaseRecord(record = {}) {
  const pageAccessToken =
    (typeof record.fb_token === "string" && record.fb_token.trim()) ||
    (typeof record.page_access_token === "string" && record.page_access_token.trim()) ||
    "";
  const pageName =
    (typeof record.fb_name === "string" && record.fb_name.trim()) ||
    (typeof record.page_name === "string" && record.page_name.trim()) ||
    "";
  const rawId = record.page_id ?? record.fb_page_id ?? record.id;

  return {
    pageId: rawId == null ? "" : String(rawId),
    pageName,
    pageAccessToken,
  };
}

async function getSupabaseFacebookConfig() {
  if (!supabaseClient) {
    return null;
  }

  const { data, error } = await supabaseClient
    .from("fb_pages")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(1);

  if (error) {
    console.error("Failed to read fb_pages from Supabase", { message: error.message });
    return null;
  }

  if (!Array.isArray(data) || data.length === 0) {
    return null;
  }

  return getNormalizedSupabaseRecord(data[0]);
}

async function getSupabaseFacebookPages() {
  if (!supabaseClient) {
    return [];
  }

  const { data, error } = await supabaseClient
    .from("fb_pages")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Failed to read fb_pages list from Supabase", { message: error.message });
    return [];
  }

  return Array.isArray(data) ? data.map(getNormalizedSupabaseRecord) : [];
}

async function saveSupabasePageToken(payload = {}) {
  if (!supabaseClient) {
    throw new Error("Supabase credentials are missing on server.");
  }

  const record = {
    fb_name: typeof payload.pageName === "string" ? payload.pageName.trim() : "",
    fb_token: typeof payload.pageAccessToken === "string" ? payload.pageAccessToken.trim() : "",
  };

  const { error: insertError } = await supabaseClient.from("fb_pages").insert(record);

  if (insertError) {
    throw new Error(`Failed to insert fb_pages token: ${insertError.message}`);
  }
}

async function getConfig() {
  const supabaseConfig = await getSupabaseFacebookConfig();

  return {
    pageId: supabaseConfig?.pageId || runtimeConfig.pageId || process.env.FB_PAGE_ID || "",
    pageName: supabaseConfig?.pageName || runtimeConfig.pageName || process.env.FB_PAGE_NAME || "",
    pageAccessToken:
      supabaseConfig?.pageAccessToken || runtimeConfig.pageAccessToken || process.env.FB_PAGE_ACCESS_TOKEN || "",
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

async function buildStatus(req) {
  const config = await getConfig();
  const connectedPages = await getSupabaseFacebookPages();

  return {
    connected: Boolean(connectedPages.length > 0 && config.verifyToken),
    pageId: config.pageId || null,
    pageName: config.pageName || null,
    hasPageAccessToken: Boolean(config.pageAccessToken),
    hasVerifyToken: Boolean(config.verifyToken),
    hasAppSecret: Boolean(config.appSecret),
    verifyToken: config.verifyToken || null,
    pageAccessTokenMasked: config.pageAccessToken ? `${config.pageAccessToken.slice(0, 4)}••••••••` : null,
    webhookUrl: `${getBaseUrl(req)}/api/webhooks/facebook`,
    connectedPages: connectedPages.map((page) => ({
      ...page,
      pageAccessTokenMasked: page.pageAccessToken ? `${page.pageAccessToken.slice(0, 4)}••••••••` : null,
    })),
    connectedCount: connectedPages.length,
    note: "Page token is loaded from Supabase table fb_pages (fb_token). Verify token and app secret still come from server runtime/env.",
  };
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Credentials", true);
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS,POST");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method === "GET") {
    return res.status(200).json(await buildStatus(req));
  }

  if (req.method === "POST") {
    const { action, pageId, pageName, pageAccessToken, verifyToken, appSecret } = req.body || {};

    if (action !== "connect") {
      return res.status(400).json({ error: "Unsupported action" });
    }

    if (!pageAccessToken || !verifyToken) {
      return res.status(400).json({ error: "pageAccessToken and verifyToken are required" });
    }

    saveConfig({ pageId, pageName, verifyToken, appSecret });

    try {
      await saveSupabasePageToken({ pageName, pageAccessToken });
    } catch (error) {
      return res.status(500).json({
        error: error.message || "Failed to save Facebook Page token to Supabase",
      });
    }

    return res.status(200).json({
      success: true,
      ...(await buildStatus(req)),
      note: "Page token saved to Supabase table fb_pages. Verify token and app secret are runtime/env settings.",
    });
  }

  return res.status(405).json({ error: "Method not allowed" });
}