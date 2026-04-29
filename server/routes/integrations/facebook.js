const crypto = require("crypto");
const express = require("express");
const { createClient } = require("@supabase/supabase-js");

const router = express.Router();

const FB_GRAPH_API_BASE = "https://graph.facebook.com/v22.0";
const DEFAULT_CHATBOT_MODEL = (process.env.GROQ_API_KEY || process.env.XAI_API_KEY)
  ? (process.env.GROQ_MODEL || "llama-3.3-70b-versatile")
  : "claude-3-sonnet-20240229";
const CONVERSATION_TTL_MS = 30 * 60 * 1000;
const CONVERSATION_MAX_MESSAGES = 8;
const conversationMemory = new Map();

const fbRuntimeConfig = {
  pageId: "",
  pageName: "",
  pageAccessToken: "",
  businessType: "",
  productServices: "",
  productServicePriceRanges: "",
  websiteLink: "",
  shoppeLink: "",
  lazadaLink: "",
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

function normalizeText(value) {
  return typeof value === "string" ? value.trim() : "";
}

function buildConversationKey(pageId, senderId) {
  const normalizedPageId = normalizePageId(pageId) || "default";
  const normalizedSenderId = typeof senderId === "string" ? senderId.trim() : String(senderId || "").trim();
  return `${normalizedPageId}:${normalizedSenderId}`;
}

function getConversationHistory(pageId, senderId) {
  const key = buildConversationKey(pageId, senderId);
  const cached = conversationMemory.get(key);

  if (!cached) {
    return [];
  }

  if (Date.now() - cached.updatedAt > CONVERSATION_TTL_MS) {
    conversationMemory.delete(key);
    return [];
  }

  return Array.isArray(cached.messages) ? cached.messages : [];
}

function setConversationHistory(pageId, senderId, messages = []) {
  const key = buildConversationKey(pageId, senderId);
  const normalizedMessages = Array.isArray(messages)
    ? messages
        .filter((msg) => msg && (msg.role === "user" || msg.role === "assistant") && typeof msg.content === "string")
        .map((msg) => ({ role: msg.role, content: msg.content.trim() }))
        .filter((msg) => msg.content)
    : [];

  const sliced = normalizedMessages.slice(-CONVERSATION_MAX_MESSAGES);
  conversationMemory.set(key, {
    updatedAt: Date.now(),
    messages: sliced,
  });
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
  const productServices =
    (typeof record.product_services === "string" && record.product_services.trim()) ||
    (typeof record.productServices === "string" && record.productServices.trim()) ||
    "";
  const productServicePriceRanges =
    (typeof record.product_service_price_ranges === "string" && record.product_service_price_ranges.trim()) ||
    (typeof record.product_service_price_range === "string" && record.product_service_price_range.trim()) ||
    (typeof record.productServicePriceRanges === "string" && record.productServicePriceRanges.trim()) ||
    "";
  const websiteLink =
    (typeof record.website_link === "string" && record.website_link.trim()) ||
    (typeof record.websiteLink === "string" && record.websiteLink.trim()) ||
    "";
  const shoppeLink =
    (typeof record.shoppe_link === "string" && record.shoppe_link.trim()) ||
    (typeof record.shoppeLink === "string" && record.shoppeLink.trim()) ||
    "";
  const lazadaLink =
    (typeof record.lazada_link === "string" && record.lazada_link.trim()) ||
    (typeof record.lazadaLink === "string" && record.lazadaLink.trim()) ||
    "";
  const rawId = record.page_id ?? record.fb_page_id ?? record.id;
  const accessMode = normalizeAccessMode(record.access_mode ?? record.accessMode);

  return {
    pageId: rawId == null ? "" : String(rawId),
    pageName,
    pageAccessToken,
    businessType,
    productServices,
    productServicePriceRanges,
    websiteLink,
    shoppeLink,
    lazadaLink,
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
    fb_name: normalizeText(payload.pageName),
    fb_token: normalizeText(payload.pageAccessToken),
    business_type: normalizeText(payload.businessType),
    product_services: normalizeText(payload.productServices),
    product_service_price_ranges: normalizeText(payload.productServicePriceRanges),
    website_link: normalizeText(payload.websiteLink),
    shoppe_link: normalizeText(payload.shoppeLink),
    lazada_link: normalizeText(payload.lazadaLink),
    access_mode: normalizeAccessMode(payload.accessMode),
  };

  let insertPayload = { ...record };
  let insertError = null;

  for (let attempt = 0; attempt < 8; attempt += 1) {
    const { error } = await supabaseClient.from("fb_pages").insert(insertPayload);

    if (!error) {
      insertError = null;
      break;
    }

    insertError = error;
    const missingColumnMatch = /column\s+"?([a-zA-Z0-9_]+)"?\s+does not exist/i.exec(error.message || "");

    if (missingColumnMatch?.[1] && Object.prototype.hasOwnProperty.call(insertPayload, missingColumnMatch[1])) {
      delete insertPayload[missingColumnMatch[1]];
      continue;
    }

    break;
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

async function updateSupabasePageDetails(pageId, payload = {}) {
  if (!supabaseClient) {
    throw new Error("Supabase credentials are missing on server.");
  }

  const normalizedPageId = normalizePageId(pageId);
  if (!normalizedPageId) {
    throw new Error("pageId is required");
  }

  const updatePayload = {
    fb_name: normalizeText(payload.pageName),
    business_type: normalizeText(payload.businessType),
    product_services: normalizeText(payload.productServices),
    product_service_price_ranges: normalizeText(payload.productServicePriceRanges),
    website_link: normalizeText(payload.websiteLink),
    shoppe_link: normalizeText(payload.shoppeLink),
    lazada_link: normalizeText(payload.lazadaLink),
  };

  const matchColumns = ["id", "page_id", "fb_page_id"];
  let lastError = null;

  for (const column of matchColumns) {
    let patch = { ...updatePayload };

    for (let attempt = 0; attempt < 6; attempt += 1) {
      const { data, error } = await supabaseClient
        .from("fb_pages")
        .update(patch)
        .eq(column, normalizedPageId)
        .select("*")
        .limit(1);

      if (!error) {
        if (Array.isArray(data) && data.length > 0) {
          return getNormalizedSupabaseRecord(data[0]);
        }

        break;
      }

      lastError = error;

      const missingColumnMatch = /column\s+"?([a-zA-Z0-9_]+)"?\s+does not exist/i.exec(error.message || "");
      if (missingColumnMatch?.[1] && Object.prototype.hasOwnProperty.call(patch, missingColumnMatch[1])) {
        delete patch[missingColumnMatch[1]];
        continue;
      }

      break;
    }
  }

  // Fallback strategy: if update is blocked or no row matched, insert a new latest record
  // preserving token/access mode from existing config. The chatbot reads the latest row.
  const current = await getSupabaseFacebookConfigByPageId(normalizedPageId);

  if (!current?.pageAccessToken) {
    if (lastError?.message) {
      throw new Error(`Failed to update page details: ${lastError.message}`);
    }

    throw new Error("Failed to update page details. Page not found.");
  }

  await saveSupabasePageToken({
    pageId: normalizedPageId,
    pageName: normalizeText(payload.pageName) || current.pageName,
    pageAccessToken: current.pageAccessToken,
    businessType: normalizeText(payload.businessType) || current.businessType,
    productServices: normalizeText(payload.productServices) || current.productServices,
    productServicePriceRanges: normalizeText(payload.productServicePriceRanges) || current.productServicePriceRanges,
    websiteLink: normalizeText(payload.websiteLink) || current.websiteLink,
    shoppeLink: normalizeText(payload.shoppeLink) || current.shoppeLink,
    lazadaLink: normalizeText(payload.lazadaLink) || current.lazadaLink,
    accessMode: current.accessMode,
  });

  const updated = await getSupabaseFacebookConfigByPageId(normalizedPageId);
  return updated || current;
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
    productServices:
      supabaseConfig?.productServices ||
      (!isPageSpecificLookup ? fbRuntimeConfig.productServices || process.env.FB_PRODUCT_SERVICES || "" : ""),
    productServicePriceRanges:
      supabaseConfig?.productServicePriceRanges ||
      (!isPageSpecificLookup
        ? fbRuntimeConfig.productServicePriceRanges || process.env.FB_PRODUCT_SERVICE_PRICE_RANGES || ""
        : ""),
    websiteLink:
      supabaseConfig?.websiteLink ||
      (!isPageSpecificLookup ? fbRuntimeConfig.websiteLink || process.env.FB_WEBSITE_LINK || "" : ""),
    shoppeLink:
      supabaseConfig?.shoppeLink ||
      (!isPageSpecificLookup ? fbRuntimeConfig.shoppeLink || process.env.FB_SHOPPE_LINK || "" : ""),
    lazadaLink:
      supabaseConfig?.lazadaLink ||
      (!isPageSpecificLookup ? fbRuntimeConfig.lazadaLink || process.env.FB_LAZADA_LINK || "" : ""),
    accessMode: normalizeAccessMode(supabaseConfig?.accessMode),
    verifyToken: fbRuntimeConfig.verifyToken || process.env.FB_VERIFY_TOKEN || "",
    appSecret: fbRuntimeConfig.appSecret || process.env.FB_APP_SECRET || "",
  };
}

function saveRuntimeConfig(payload = {}) {
  const normalizedPageId = normalizePageId(payload.pageId);
  if (normalizedPageId) fbRuntimeConfig.pageId = normalizedPageId;
  if (typeof payload.pageName === "string") fbRuntimeConfig.pageName = normalizeText(payload.pageName);
  if (typeof payload.pageAccessToken === "string") fbRuntimeConfig.pageAccessToken = normalizeText(payload.pageAccessToken);
  if (typeof payload.businessType === "string") fbRuntimeConfig.businessType = normalizeText(payload.businessType);
  if (typeof payload.productServices === "string") fbRuntimeConfig.productServices = normalizeText(payload.productServices);
  if (typeof payload.productServicePriceRanges === "string") {
    fbRuntimeConfig.productServicePriceRanges = normalizeText(payload.productServicePriceRanges);
  }
  if (typeof payload.websiteLink === "string") fbRuntimeConfig.websiteLink = normalizeText(payload.websiteLink);
  if (typeof payload.shoppeLink === "string") fbRuntimeConfig.shoppeLink = normalizeText(payload.shoppeLink);
  if (typeof payload.lazadaLink === "string") fbRuntimeConfig.lazadaLink = normalizeText(payload.lazadaLink);
  if (typeof payload.verifyToken === "string") fbRuntimeConfig.verifyToken = normalizeText(payload.verifyToken);
  if (typeof payload.appSecret === "string") fbRuntimeConfig.appSecret = normalizeText(payload.appSecret);
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
    if (textPart?.text) return compactFacebookReply(textPart.text);
  }

  if (typeof result.message === "string") return compactFacebookReply(result.message);
  if (typeof result.text === "string") return compactFacebookReply(result.text);

  return "I can help with CRM, ERP, appointment booking, analytics, and email marketing.";
}

function compactFacebookReply(rawText) {
  let cleaned = typeof rawText === "string" ? rawText : String(rawText || "");
  cleaned = cleaned.trim();

  // Remove common meta wrappers that make replies sound robotic.
  cleaned = cleaned.replace(/^based on the context provided[^\n]*\n?/i, "");
  cleaned = cleaned.replace(/^here'?s a possible response[:\s]*/i, "");
  cleaned = cleaned.replace(/^"|"$/g, "");
  cleaned = cleaned.replace(/\s+/g, " ").trim();

  const maxChars = 420;
  if (cleaned.length > maxChars) {
    const short = cleaned.slice(0, maxChars);
    const lastSentenceEnd = Math.max(short.lastIndexOf("."), short.lastIndexOf("!"), short.lastIndexOf("?"));
    cleaned = lastSentenceEnd > 120 ? short.slice(0, lastSentenceEnd + 1).trim() : `${short.trim()}...`;
  }

  // Humanize and add a subtle emoticon to make replies feel friendlier.
  // If the reply already ends with an emoji, don't add another.
  const emojiList = ["🙂", "😊", "👍", "🙌", "😉", "✨"];
  const endsWithEmoji = /[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]+$/u;

  let final = cleaned;
  if (!final) {
    return "Sige, paano kita matutulungan ngayon? " + emojiList[0];
  }

  // If short reply, prefer adding a small friendly phrase punctuation.
  if (final.length < 80 && !/[.!?]$/.test(final)) {
    final = final.trim() + '.';
  }

  if (!endsWithEmoji.test(final)) {
    // Pick a small emoji deterministically but varied enough.
    const idx = Math.floor(Math.abs(hashCode(final)) % emojiList.length);
    final = `${final} ${emojiList[idx]}`;
  }

  return final;
}

function hashCode(str) {
  let h = 0;
  if (!str) return h;
  for (let i = 0; i < str.length; i++) {
    h = (Math.imul(31, h) + str.charCodeAt(i)) | 0;
  }
  return h;
}

function buildBusinessFallbackReply(context = {}, userText = "") {
  const productServices = typeof context.productServices === "string" ? context.productServices.trim() : "";
  const businessType = typeof context.businessType === "string" ? context.businessType.trim() : "";
  const pageName = typeof context.pageName === "string" ? context.pageName.trim() : "";
  const websiteLink = typeof context.websiteLink === "string" ? context.websiteLink.trim() : "";
  const shoppeLink = typeof context.shoppeLink === "string" ? context.shoppeLink.trim() : "";
  const lazadaLink = typeof context.lazadaLink === "string" ? context.lazadaLink.trim() : "";
  const productServicePriceRanges = typeof context.productServicePriceRanges === "string"
    ? context.productServicePriceRanges.trim()
    : "";

  const hasTagalog = /\b(ano|saan|may|wala|pa|po|kayo|kami|nyo|niyo|salamat|magkano)\b/i.test(userText);
  const langTagalog = hasTagalog;

  const parts = [];
  if (pageName) {
    parts.push(langTagalog ? `Ito ang mga ino-offer ng ${pageName}:` : `Here is what ${pageName} offers:`);
  } else {
    parts.push(langTagalog ? "Ito ang mga services namin:" : "Here are our services:");
  }

  if (productServices) {
    parts.push(productServices);
  } else if (businessType) {
    parts.push(langTagalog ? `Business type: ${businessType}.` : `Business type: ${businessType}.`);
  } else {
    parts.push(langTagalog ? "Wala pa kaming nakalistang services ngayon." : "We don't have listed services yet.");
  }

  if (productServicePriceRanges) {
    parts.push(`Price range: ${productServicePriceRanges}`);
  }

  if (websiteLink) {
    parts.push(langTagalog ? `Website: ${websiteLink}` : `Website: ${websiteLink}`);
  }
  if (shoppeLink) {
    parts.push(langTagalog ? `Shopee: ${shoppeLink}` : `Shopee: ${shoppeLink}`);
  }
  if (lazadaLink) {
    parts.push(langTagalog ? `Lazada: ${lazadaLink}` : `Lazada: ${lazadaLink}`);
  }

  return parts.join(" ");
}

async function generateChatbotReply(input, context = {}) {
  const messages = Array.isArray(input)
    ? input
    : [
        {
          role: "user",
          content: typeof input === "string" ? input : String(input || ""),
        },
      ];

  const chatEndpoint =
    process.env.INTERNAL_CHATBOT_URL ||
    `http://127.0.0.1:${process.env.PORT || 5000}/api/openclaude/chat`;

  const response = await fetch(chatEndpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      messages,
      model: DEFAULT_CHATBOT_MODEL,
      options: {
        maxTokens: 40,
        temperature: 0.65,
        channel: "facebook",
        promptMode: "lite",
        multilingual: true,
        businessType: typeof context.businessType === "string" ? context.businessType : "",
        pageName: typeof context.pageName === "string" ? context.pageName : "",
        productServices: typeof context.productServices === "string" ? context.productServices : "",
        productServicePriceRanges:
          typeof context.productServicePriceRanges === "string" ? context.productServicePriceRanges : "",
        websiteLink: typeof context.websiteLink === "string" ? context.websiteLink : "",
        shoppeLink: typeof context.shoppeLink === "string" ? context.shoppeLink : "",
        lazadaLink: typeof context.lazadaLink === "string" ? context.lazadaLink : "",
      },
    }),
  });

  if (!response.ok) {
    if (response.status === 402) {
      const lastUser = messages
        .slice()
        .reverse()
        .find((m) => m.role === "user");
      const lastUserText = typeof lastUser?.content === "string" ? lastUser.content : "";
      return compactFacebookReply(buildBusinessFallbackReply(context, lastUserText));
    }

    throw new Error(`Chatbot API error (${response.status})`);
  }

  const result = await response.json();
  const replyText = extractReplyText(result);

  if (
    result?.restricted === true ||
    /I can only help with:/i.test(replyText)
  ) {
    const lastUser = messages
      .slice()
      .reverse()
      .find((m) => m.role === "user");
    const lastUserText = typeof lastUser?.content === "string" ? lastUser.content : "";
    return compactFacebookReply(buildBusinessFallbackReply(context, lastUserText));
  }

  return replyText;
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
    productServices: config.productServices || null,
    productServicePriceRanges: config.productServicePriceRanges || null,
    websiteLink: config.websiteLink || null,
    shoppeLink: config.shoppeLink || null,
    lazadaLink: config.lazadaLink || null,
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
  const {
    pageId,
    pageName,
    pageAccessToken,
    verifyToken,
    appSecret,
    accessMode,
    businessType,
    productServices,
    productServicePriceRanges,
    websiteLink,
    shoppeLink,
    lazadaLink,
  } = req.body || {};

  if (!pageAccessToken || !verifyToken) {
    return res.status(400).json({
      error: "pageAccessToken and verifyToken are required",
    });
  }

  saveRuntimeConfig({
    pageId,
    pageName,
    verifyToken,
    appSecret,
    businessType,
    productServices,
    productServicePriceRanges,
    websiteLink,
    shoppeLink,
    lazadaLink,
  });

  try {
    await saveSupabasePageToken({
      pageId,
      pageName,
      pageAccessToken,
      accessMode,
      businessType,
      productServices,
      productServicePriceRanges,
      websiteLink,
      shoppeLink,
      lazadaLink,
    });
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
    productServices: config.productServices || null,
    productServicePriceRanges: config.productServicePriceRanges || null,
    websiteLink: config.websiteLink || null,
    shoppeLink: config.shoppeLink || null,
    lazadaLink: config.lazadaLink || null,
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

router.post("/admin/page-details", async (req, res) => {
  const {
    pageId,
    pageName,
    businessType,
    productServices,
    productServicePriceRanges,
    websiteLink,
    shoppeLink,
    lazadaLink,
  } = req.body || {};

  try {
    await updateSupabasePageDetails(pageId, {
      pageName,
      businessType,
      productServices,
      productServicePriceRanges,
      websiteLink,
      shoppeLink,
      lazadaLink,
    });
  } catch (error) {
    return res.status(400).json({
      error: error.message || "Failed to update page details",
    });
  }

  saveRuntimeConfig({
    pageId,
    pageName,
    businessType,
    productServices,
    productServicePriceRanges,
    websiteLink,
    shoppeLink,
    lazadaLink,
  });

  const config = await getFacebookConfig();
  const connectedPages = await getSupabaseFacebookPages();
  const baseUrl = getPublicBaseUrl(req);

  return res.status(200).json({
    success: true,
    connected: Boolean(connectedPages.length > 0 && config.verifyToken),
    pageId: config.pageId || null,
    pageName: config.pageName || null,
    businessType: config.businessType || null,
    productServices: config.productServices || null,
    productServicePriceRanges: config.productServicePriceRanges || null,
    websiteLink: config.websiteLink || null,
    shoppeLink: config.shoppeLink || null,
    lazadaLink: config.lazadaLink || null,
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
    note: "Page details updated successfully.",
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
        const productServices = pageConfig.productServices || "";
        const productServicePriceRanges = pageConfig.productServicePriceRanges || "";
        const websiteLink = pageConfig.websiteLink || "";
        const shoppeLink = pageConfig.shoppeLink || "";
        const lazadaLink = pageConfig.lazadaLink || "";
        const memoryPageId = pageConfig.pageId || pageId;
        const history = getConversationHistory(memoryPageId, senderId);
        const requestMessages = [...history, { role: "user", content: incomingText }];
        const replyText = chatbotEnabled
          ? await generateChatbotReply(requestMessages, {
              businessType,
              pageName,
              productServices,
              productServicePriceRanges,
              websiteLink,
              shoppeLink,
              lazadaLink,
            })
          : "Chatbot not available. Contact the admin.";

        if (chatbotEnabled) {
          setConversationHistory(memoryPageId, senderId, [
            ...requestMessages,
            { role: "assistant", content: replyText },
          ]);
        }

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
