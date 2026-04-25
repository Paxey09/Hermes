const crypto = require("crypto");
const express = require("express");
const { createClient } = require("@supabase/supabase-js");

const router = express.Router();

const FB_GRAPH_API_BASE = "https://graph.facebook.com/v22.0";
const fbRuntimeConfig = {
  pageId: "",
  pageName: "",
  pageAccessToken: "",
  businessType: "",
  verifyToken: "",
  appSecret: "",
};

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServerKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
const supabaseClient = supabaseUrl && supabaseServerKey ? createClient(supabaseUrl, supabaseServerKey) : null;

function normalizeAccessMode(value) {
  return typeof value === "string" && value.trim().toLowerCase() === "disable" ? "disable" : "enable";
}

function normalizePageId(value) {
  if (typeof value === "number") return String(value);
  if (typeof value === "string") return value.trim();
  return "";
}

function getNormalizedSupabaseRecord(record = {}) {
  const pageAccessToken =
    (typeof record.fb_token === "string" && record.fb_token.trim()) ||
    (typeof record.page_access_token === "string" && record.page_access_token.trim()) ||
    "";
  const pageName =
    (typeof record.fb_name === "string" && record.fb_name.trim()) ||
    (typeof record.page_name === "string" && record.page_name.trim()) ||
    "";
  const businessType =
    (typeof record.business_type === "string" && record.business_type.trim()) ||
    (typeof record.businessType === "string" && record.businessType.trim()) ||
    "";
  const rawId = record.page_id ?? record.fb_page_id ?? record.id;
  const accessMode = normalizeAccessMode(record.access_mode ?? record.accessMode);

  return {
    pageId: rawId == null ? "" : String(rawId),
    pageName,
    pageAccessToken,
    businessType,
    accessMode,
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

async function getSupabaseFacebookConfigByPageId(pageId) {
  if (!supabaseClient) {
    return null;
  }

  const normalizedPageId = normalizePageId(pageId);
  if (!normalizedPageId) {
    return null;
  }

  const matchColumns = ["page_id", "fb_page_id", "id"];
  for (const column of matchColumns) {
    const { data, error } = await supabaseClient
      .from("fb_pages")
      .select("*")
      .eq(column, normalizedPageId)
      .order("created_at", { ascending: false })
      .limit(1);

    if (error) {
      continue;
    }

    if (Array.isArray(data) && data.length > 0) {
      return getNormalizedSupabaseRecord(data[0]);
    }
  }

  return null;
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

  const normalizedPageId = normalizePageId(payload.pageId);

  const record = {
    page_id: normalizedPageId || null,
    fb_name: typeof payload.pageName === "string" ? payload.pageName.trim() : "",
    fb_token: typeof payload.pageAccessToken === "string" ? payload.pageAccessToken.trim() : "",
    business_type: typeof payload.businessType === "string" ? payload.businessType.trim() : "",
    access_mode: normalizeAccessMode(payload.accessMode),
  };

  let { error: insertError } = await supabaseClient.from("fb_pages").insert(record);

  if (insertError && /column\s+"?page_id"?\s+does not exist/i.test(insertError.message || "")) {
    const { page_id, ...legacyRecord } = record;
    const fallbackInsert = await supabaseClient.from("fb_pages").insert(legacyRecord);
    insertError = fallbackInsert.error;
  }

  if (insertError) {
    throw new Error(`Failed to insert fb_pages token: ${insertError.message}`);
  }
}

async function updateSupabasePageAccessMode(pageId, accessMode) {
  if (!supabaseClient) {
    throw new Error("Supabase credentials are missing on server.");
  }

  const normalizedPageId = normalizePageId(pageId);
  if (!normalizedPageId) {
    throw new Error("pageId is required");
  }

  const nextAccessMode = normalizeAccessMode(accessMode);

  const matchColumns = ["id", "page_id", "fb_page_id"];
  for (const column of matchColumns) {
    const { data, error } = await supabaseClient
      .from("fb_pages")
      .update({ access_mode: nextAccessMode })
      .eq(column, normalizedPageId)
      .select("*")
      .limit(1);

    if (error) {
      continue;
    }

    if (Array.isArray(data) && data.length > 0) {
      return getNormalizedSupabaseRecord(data[0]);
    }
  }

  throw new Error("Failed to update access mode. Page not found.");
}

async function getFacebookConfig(options = {}) {
  const requestedPageId = normalizePageId(options.pageId);
  const supabaseConfig = requestedPageId
    ? await getSupabaseFacebookConfigByPageId(requestedPageId)
    : await getSupabaseFacebookConfig();
  const isPageSpecificLookup = Boolean(requestedPageId);

  return {
    pageId: supabaseConfig?.pageId || requestedPageId || fbRuntimeConfig.pageId || process.env.FB_PAGE_ID || "",
    pageName:
      supabaseConfig?.pageName || (!isPageSpecificLookup ? fbRuntimeConfig.pageName || process.env.FB_PAGE_NAME || "" : ""),
    pageAccessToken:
      supabaseConfig?.pageAccessToken ||
      (!isPageSpecificLookup ? fbRuntimeConfig.pageAccessToken || process.env.FB_PAGE_ACCESS_TOKEN || "" : ""),
    businessType:
      supabaseConfig?.businessType ||
      (!isPageSpecificLookup ? fbRuntimeConfig.businessType || process.env.FB_BUSINESS_TYPE || "" : ""),
    accessMode: normalizeAccessMode(supabaseConfig?.accessMode),
    verifyToken: fbRuntimeConfig.verifyToken || process.env.FB_VERIFY_TOKEN || "",
    appSecret: fbRuntimeConfig.appSecret || process.env.FB_APP_SECRET || "",
  };
}

function saveRuntimeConfig(payload = {}) {
  const normalizedPageId = normalizePageId(payload.pageId);
  if (normalizedPageId) fbRuntimeConfig.pageId = normalizedPageId;
  if (typeof payload.pageName === "string") fbRuntimeConfig.pageName = payload.pageName.trim();
  if (typeof payload.pageAccessToken === "string") fbRuntimeConfig.pageAccessToken = payload.pageAccessToken.trim();
  if (typeof payload.businessType === "string") fbRuntimeConfig.businessType = payload.businessType.trim();
  if (typeof payload.verifyToken === "string") fbRuntimeConfig.verifyToken = payload.verifyToken.trim();
  if (typeof payload.appSecret === "string") fbRuntimeConfig.appSecret = payload.appSecret.trim();
}

function getPublicBaseUrl(req) {
  const configured =
    process.env.PUBLIC_BASE_URL ||
    process.env.RENDER_EXTERNAL_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "");

  if (configured) {
    return configured.replace(/\/$/, "");
  }

  return `${req.protocol}://${req.get("host")}`;
}

async function verifyFacebookSignature(req) {
  const config = await getFacebookConfig();
  const appSecret = config.appSecret;
  if (!appSecret) {
    return true;
  }

  const signature = req.headers["x-hub-signature-256"];
  if (!signature || !req.rawBody) {
    return false;
  }

  const expected = `sha256=${crypto
    .createHmac("sha256", appSecret)
    .update(req.rawBody)
    .digest("hex")}`;

  try {
    return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
  } catch {
    return false;
  }
}

function extractReplyText(result) {
  if (!result) return "I can help with CRM, ERP, appointment booking, analytics, and email marketing.";

  if (Array.isArray(result.content) && result.content.length > 0) {
    const textPart = result.content.find((part) => part?.type === "text");
    if (textPart?.text) return textPart.text;
  }

  if (typeof result.message === "string") return result.message;
  if (typeof result.text === "string") return result.text;

  return "I can help with CRM, ERP, appointment booking, analytics, and email marketing.";
}

async function generateChatbotReply(userText, context = {}) {
  const chatEndpoint =
    process.env.INTERNAL_CHATBOT_URL ||
    `http://127.0.0.1:${process.env.PORT || 5000}/api/openclaude/chat`;

  const response = await fetch(chatEndpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      messages: [
        {
          role: "user",
          content: userText,
        },
      ],
      model: "claude-3-sonnet-20240229",
      options: {
        maxTokens: 500,
        temperature: 0.65,
        channel: "facebook",
        multilingual: true,
        businessType: typeof context.businessType === "string" ? context.businessType : "",
        pageName: typeof context.pageName === "string" ? context.pageName : "",
      },
    }),
  });

  if (!response.ok) {
    throw new Error(`Chatbot API error (${response.status})`);
  }

  const result = await response.json();
  return extractReplyText(result);
}

async function sendFacebookMessage(recipientId, text, context = {}) {
  const pageAccessToken =
    (typeof context.pageAccessToken === "string" && context.pageAccessToken.trim()) ||
    (await getFacebookConfig({ pageId: context.pageId })).pageAccessToken;

  if (!pageAccessToken) {
    throw new Error("Missing Facebook Page token from Supabase (fb_pages.fb_token)");
  }

  const response = await fetch(
    `${FB_GRAPH_API_BASE}/me/messages?access_token=${encodeURIComponent(pageAccessToken)}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        recipient: { id: recipientId },
        messaging_type: "RESPONSE",
        message: { text },
      }),
    }
  );

  if (!response.ok) {
    const details = await response.text();
    throw new Error(`Facebook Send API error (${response.status}): ${details}`);
  }
}

router.get("/", async (req, res) => {
  const mode = req.query["hub.mode"] || req.query.hub_mode;
  const token = req.query["hub.verify_token"] || req.query.hub_verify_token;
  const challenge = req.query["hub.challenge"] || req.query.hub_challenge;

  const config = await getFacebookConfig();
  const expectedToken = (config.verifyToken || "").trim();
  const receivedToken = typeof token === "string" ? token.trim() : token;

  if (mode === "subscribe" && receivedToken && receivedToken === expectedToken) {
    return res.status(200).send(challenge);
  }

  console.error("Facebook webhook verification failed", {
    mode,
    hasToken: Boolean(receivedToken),
    tokenMatched: receivedToken === expectedToken,
    hasChallenge: Boolean(challenge),
  });

  return res.sendStatus(403);
});

router.get("/admin/status", async (req, res) => {
  const config = await getFacebookConfig();
  const connectedPages = await getSupabaseFacebookPages();
  const baseUrl = getPublicBaseUrl(req);

  res.status(200).json({
    connected: Boolean(connectedPages.length > 0 && config.verifyToken),
    pageId: config.pageId || null,
    pageName: config.pageName || null,
    businessType: config.businessType || null,
    hasPageAccessToken: Boolean(config.pageAccessToken),
    hasVerifyToken: Boolean(config.verifyToken),
    hasAppSecret: Boolean(config.appSecret),
    accessMode: config.accessMode,
    verifyToken: config.verifyToken || null,
    pageAccessTokenMasked: config.pageAccessToken ? `${config.pageAccessToken.slice(0, 4)}••••••••` : null,
    webhookUrl: `${baseUrl}/api/webhooks/facebook`,
    connectedPages: connectedPages.map((page) => ({
      ...page,
      pageAccessTokenMasked: page.pageAccessToken ? `${page.pageAccessToken.slice(0, 4)}••••••••` : null,
    })),
    connectedCount: connectedPages.length,
    note: "Page token is loaded from Supabase table fb_pages (fb_token). Verify token and app secret still come from server runtime/env.",
  });
});

router.post("/admin/connect", async (req, res) => {
  const { pageId, pageName, pageAccessToken, verifyToken, appSecret, accessMode, businessType } = req.body || {};

  if (!pageAccessToken || !verifyToken) {
    return res.status(400).json({
      error: "pageAccessToken and verifyToken are required",
    });
  }

  saveRuntimeConfig({ pageId, pageName, verifyToken, appSecret, businessType });

  try {
    await saveSupabasePageToken({ pageId, pageName, pageAccessToken, accessMode, businessType });
  } catch (error) {
    return res.status(500).json({
      error: error.message || "Failed to save Facebook Page token to Supabase",
    });
  }

  const config = await getFacebookConfig();
  const connectedPages = await getSupabaseFacebookPages();
  const baseUrl = getPublicBaseUrl(req);

  return res.status(200).json({
    success: true,
    connected: Boolean(connectedPages.length > 0 && config.verifyToken),
    pageId: config.pageId || null,
    pageName: config.pageName || null,
    businessType: config.businessType || null,
    hasPageAccessToken: Boolean(config.pageAccessToken),
    hasVerifyToken: Boolean(config.verifyToken),
    hasAppSecret: Boolean(config.appSecret),
    accessMode: config.accessMode,
    verifyToken: config.verifyToken || null,
    pageAccessTokenMasked: config.pageAccessToken ? `${config.pageAccessToken.slice(0, 4)}••••••••` : null,
    webhookUrl: `${baseUrl}/api/webhooks/facebook`,
    connectedPages: connectedPages.map((page) => ({
      ...page,
      pageAccessTokenMasked: page.pageAccessToken ? `${page.pageAccessToken.slice(0, 4)}••••••••` : null,
    })),
    connectedCount: connectedPages.length,
    note: "Page token saved to Supabase table fb_pages. Verify token and app secret are runtime/env settings.",
  });
});

router.post("/admin/access-mode", async (req, res) => {
  const { pageId, accessMode } = req.body || {};

  try {
    await updateSupabasePageAccessMode(pageId, accessMode);
  } catch (error) {
    return res.status(400).json({
      error: error.message || "Failed to update access mode",
    });
  }

  const config = await getFacebookConfig();
  const connectedPages = await getSupabaseFacebookPages();
  const baseUrl = getPublicBaseUrl(req);

  return res.status(200).json({
    success: true,
    connected: Boolean(connectedPages.length > 0 && config.verifyToken),
    pageId: config.pageId || null,
    pageName: config.pageName || null,
    businessType: config.businessType || null,
    hasPageAccessToken: Boolean(config.pageAccessToken),
    hasVerifyToken: Boolean(config.verifyToken),
    hasAppSecret: Boolean(config.appSecret),
    accessMode: config.accessMode,
    verifyToken: config.verifyToken || null,
    pageAccessTokenMasked: config.pageAccessToken ? `${config.pageAccessToken.slice(0, 4)}••••••••` : null,
    webhookUrl: `${baseUrl}/api/webhooks/facebook`,
    connectedPages: connectedPages.map((page) => ({
      ...page,
      pageAccessTokenMasked: page.pageAccessToken ? `${page.pageAccessToken.slice(0, 4)}••••••••` : null,
    })),
    connectedCount: connectedPages.length,
    note: "Access mode updated successfully.",
  });
});

router.post("/", async (req, res) => {
  if (!(await verifyFacebookSignature(req))) {
    return res.status(403).json({ error: "Invalid Facebook webhook signature" });
  }

  if (req.body.object !== "page") {
    return res.sendStatus(404);
  }

  const messageEvents = [];

  for (const entry of req.body.entry || []) {
    for (const event of entry.messaging || []) {
      const senderId = event?.sender?.id;
      const recipientPageId = normalizePageId(event?.recipient?.id);
      const incomingText = event?.message?.text;
      const normalizedSenderId =
        typeof senderId === "number"
          ? String(senderId)
          : typeof senderId === "string"
          ? senderId.trim()
          : "";
      const hasValidSenderId = /^\d+$/.test(normalizedSenderId);

      if (!hasValidSenderId || !incomingText || event?.message?.is_echo) {
        if (incomingText && !event?.message?.is_echo) {
          console.warn("Skipping webhook event with invalid sender id", {
            entryId: entry?.id,
            senderId,
            senderIdType: typeof senderId,
          });
        }
        continue;
      }

      messageEvents.push({
        senderId: normalizedSenderId,
        incomingText,
        entryId: entry?.id,
        pageId: recipientPageId || normalizePageId(entry?.id),
      });
    }
  }

  // Acknowledge immediately so Meta does not treat the webhook as timed out.
  res.status(200).send("EVENT_RECEIVED");

  if (messageEvents.length === 0) {
    return;
  }

  const pageConfigCache = new Map();

  async function getCachedPageConfig(pageId) {
    const cacheKey = normalizePageId(pageId) || "default";
    if (!pageConfigCache.has(cacheKey)) {
      pageConfigCache.set(cacheKey, await getFacebookConfig({ pageId }));
    }
    return pageConfigCache.get(cacheKey);
  }

  void Promise.allSettled(
    messageEvents.map(async ({ senderId, incomingText, entryId, pageId }) => {
      try {
        const pageConfig = await getCachedPageConfig(pageId);
        const chatbotEnabled = pageConfig.accessMode !== "disable";
        const businessType = pageConfig.businessType || "";
        const pageName = pageConfig.pageName || "";
        const replyText = chatbotEnabled
          ? await generateChatbotReply(incomingText, { businessType, pageName })
          : "Chatbot not available. Contact the admin.";
        await sendFacebookMessage(senderId, replyText, {
          pageId: pageConfig.pageId,
          pageAccessToken: pageConfig.pageAccessToken,
        });
      } catch (error) {
        console.error("Facebook webhook reply error:", {
          message: error.message,
          senderId,
          entryId,
          pageId,
        });
        try {
          await sendFacebookMessage(
            senderId,
            "I can only help with CRM, ERP, appointment booking, data analytics & market research, and email marketing.",
            { pageId }
          );
        } catch (fallbackError) {
          console.error("Facebook webhook fallback send error:", {
            message: fallbackError.message,
            senderId,
            entryId,
            pageId,
          });
        }
      }
    })
  );
});

module.exports = router;
