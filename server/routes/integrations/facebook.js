const crypto = require("crypto");
const express = require("express");

const router = express.Router();

const FB_GRAPH_API_BASE = "https://graph.facebook.com/v22.0";
const fbRuntimeConfig = {
  pageId: "",
  pageName: "",
  pageAccessToken: "",
  verifyToken: "",
  appSecret: "",
};

function getFacebookConfig() {
  return {
    pageId: fbRuntimeConfig.pageId || process.env.FB_PAGE_ID || "",
    pageName: fbRuntimeConfig.pageName || process.env.FB_PAGE_NAME || "",
    pageAccessToken: fbRuntimeConfig.pageAccessToken || process.env.FB_PAGE_ACCESS_TOKEN || "",
    verifyToken: fbRuntimeConfig.verifyToken || process.env.FB_VERIFY_TOKEN || "",
    appSecret: fbRuntimeConfig.appSecret || process.env.FB_APP_SECRET || "",
  };
}

function saveRuntimeConfig(payload = {}) {
  if (typeof payload.pageId === "string") fbRuntimeConfig.pageId = payload.pageId.trim();
  if (typeof payload.pageName === "string") fbRuntimeConfig.pageName = payload.pageName.trim();
  if (typeof payload.pageAccessToken === "string") fbRuntimeConfig.pageAccessToken = payload.pageAccessToken.trim();
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

function verifyFacebookSignature(req) {
  const appSecret = getFacebookConfig().appSecret;
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

async function generateChatbotReply(userText) {
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
        temperature: 0.5,
      },
    }),
  });

  if (!response.ok) {
    throw new Error(`Chatbot API error (${response.status})`);
  }

  const result = await response.json();
  return extractReplyText(result);
}

async function sendFacebookMessage(recipientId, text) {
  const pageAccessToken = getFacebookConfig().pageAccessToken;

  if (!pageAccessToken) {
    throw new Error("Missing FB_PAGE_ACCESS_TOKEN in server environment");
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

router.get("/", (req, res) => {
  const mode = req.query["hub.mode"] || req.query.hub_mode;
  const token = req.query["hub.verify_token"] || req.query.hub_verify_token;
  const challenge = req.query["hub.challenge"] || req.query.hub_challenge;

  const expectedToken = (getFacebookConfig().verifyToken || "").trim();
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

router.get("/admin/status", (req, res) => {
  const config = getFacebookConfig();
  const baseUrl = getPublicBaseUrl(req);

  res.status(200).json({
    connected: Boolean(config.pageAccessToken && config.verifyToken),
    pageId: config.pageId || null,
    pageName: config.pageName || null,
    hasPageAccessToken: Boolean(config.pageAccessToken),
    hasVerifyToken: Boolean(config.verifyToken),
    hasAppSecret: Boolean(config.appSecret),
    verifyToken: config.verifyToken || null,
    pageAccessTokenMasked: config.pageAccessToken ? `${config.pageAccessToken.slice(0, 4)}••••••••` : null,
    webhookUrl: `${baseUrl}/api/webhooks/facebook`,
    note: "Credentials set from this panel are runtime-only. Add them to environment variables for persistence.",
  });
});

router.post("/admin/connect", (req, res) => {
  const { pageId, pageName, pageAccessToken, verifyToken, appSecret } = req.body || {};

  if (!pageAccessToken || !verifyToken) {
    return res.status(400).json({
      error: "pageAccessToken and verifyToken are required",
    });
  }

  saveRuntimeConfig({ pageId, pageName, pageAccessToken, verifyToken, appSecret });
  const config = getFacebookConfig();
  const baseUrl = getPublicBaseUrl(req);

  return res.status(200).json({
    success: true,
    connected: Boolean(config.pageAccessToken && config.verifyToken),
    pageId: config.pageId || null,
    pageName: config.pageName || null,
    hasPageAccessToken: Boolean(config.pageAccessToken),
    hasVerifyToken: Boolean(config.verifyToken),
    hasAppSecret: Boolean(config.appSecret),
    verifyToken: config.verifyToken || null,
    pageAccessTokenMasked: config.pageAccessToken ? `${config.pageAccessToken.slice(0, 4)}••••••••` : null,
    webhookUrl: `${baseUrl}/api/webhooks/facebook`,
    note: "Connection saved for current runtime. Add FB_* env vars to keep this after restart/redeploy.",
  });
});

router.post("/", async (req, res) => {
  if (!verifyFacebookSignature(req)) {
    return res.status(403).json({ error: "Invalid Facebook webhook signature" });
  }

  if (req.body.object !== "page") {
    return res.sendStatus(404);
  }

  const messageEvents = [];

  for (const entry of req.body.entry || []) {
    for (const event of entry.messaging || []) {
      const senderId = event?.sender?.id;
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

      messageEvents.push({ senderId: normalizedSenderId, incomingText, entryId: entry?.id });
    }
  }

  // Acknowledge immediately so Meta does not treat the webhook as timed out.
  res.status(200).send("EVENT_RECEIVED");

  if (messageEvents.length === 0) {
    return;
  }

  void Promise.allSettled(
    messageEvents.map(async ({ senderId, incomingText, entryId }) => {
      try {
        const replyText = await generateChatbotReply(incomingText);
        await sendFacebookMessage(senderId, replyText);
      } catch (error) {
        console.error("Facebook webhook reply error:", {
          message: error.message,
          senderId,
          entryId,
        });
        try {
          await sendFacebookMessage(
            senderId,
            "I can only help with CRM, ERP, appointment booking, data analytics & market research, and email marketing."
          );
        } catch (fallbackError) {
          console.error("Facebook webhook fallback send error:", {
            message: fallbackError.message,
            senderId,
            entryId,
          });
        }
      }
    })
  );
});

module.exports = router;
