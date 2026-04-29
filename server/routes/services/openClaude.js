const express = require("express");
const router = express.Router();

const OPENCLAUDE_API_URL = "https://api.anthropic.com/v1/messages";
const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions";
const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
const DEFAULT_GROQ_MODEL = process.env.GROQ_MODEL || "llama-3.3-70b-versatile";
const DEFAULT_MODEL = (process.env.GROQ_API_KEY || process.env.XAI_API_KEY) ? DEFAULT_GROQ_MODEL : "claude-3-sonnet-20240229";

const OPENROUTER_MODEL_MAP = {
  "claude-3-sonnet-20240229": "anthropic/claude-3.5-sonnet",
  "claude-3-opus-20240229": "anthropic/claude-3-opus",
  "claude-3-haiku-20240307": "anthropic/claude-3-haiku",
};


const GROQ_MODEL_MAP = {
  "claude-3-sonnet-20240229": DEFAULT_GROQ_MODEL,
  "claude-3-opus-20240229": DEFAULT_GROQ_MODEL,
  "claude-3-haiku-20240307": DEFAULT_GROQ_MODEL,
  "openai/gpt-4o-mini": DEFAULT_GROQ_MODEL,
  "gpt-4o-mini": DEFAULT_GROQ_MODEL,
  "openai/gpt-4o": DEFAULT_GROQ_MODEL,
  "gpt-4o": DEFAULT_GROQ_MODEL,
  "grok-2-latest": DEFAULT_GROQ_MODEL,
  "grok-4.20": DEFAULT_GROQ_MODEL,
};

const SUPPORTED_TOPICS = [
  "CRM",
  "ERP",
  "Appointment Booking",
  "Data Analytics & Market Research",
  "Email Marketing",
  "Sales",
  "Customer Service",
];

const TOPIC_KEYWORDS = [
  "crm",
  "customer relationship",
  "lead",
  "sales pipeline",
  "sales",
  "selling",
  "upsell",
  "cross-sell",
  "proposal",
  "quotation",
  "quote",
  "pricing",
  "negotiation",
  "deal",
  "conversion",
  "erp",
  "enterprise resource planning",
  "inventory",
  "procurement",
  "appointment",
  "booking",
  "schedule",
  "calendar",
  "data analytics",
  "analytics",
  "market research",
  "market analysis",
  "email marketing",
  "newsletter",
  "campaign",
  "email campaign",
  "customer support",
  "customer service",
  "service request",
  "complaint",
  "ticket",
  "refund",
  "billing",
  "subscription",
  "onboarding",
  "retention",
  "csr",
  "suporta",
  "serbisyo",
  "benta",
  "kliyente",
  "customer",
  "order",
  "bayad",
  "tanong",
];

function isGroqCompatibleModel(model) {
  return typeof model === "string" && (
    model.startsWith("llama-") ||
    model.startsWith("openai/") ||
    model.startsWith("qwen/") ||
    model.startsWith("meta-llama/") ||
    model.startsWith("mixtral/") ||
    model.startsWith("gemma/") ||
    model.startsWith("groq/")
  );
}

async function callViaGroq({ messages, model, options, apiKey }) {
  const mappedModel = GROQ_MODEL_MAP[model] || (isGroqCompatibleModel(model) ? model : DEFAULT_GROQ_MODEL);

  const buildPayload = (selectedModel) => ({
    model: selectedModel,
    messages: buildPromptedMessages(messages, options),
    max_tokens: options?.maxTokens || 2048,
    temperature: options?.temperature ?? 0.7,
  });

  const response = await fetch(GROQ_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(buildPayload(mappedModel)),
  });

  const data = await response.json();

  if (!response.ok) {
    const error = new Error(data?.error?.message || response.statusText || "Groq request failed");
    error.status = response.status;
    error.details = data;
    throw error;
  }

  const text = data?.choices?.[0]?.message?.content || "No response text returned.";
  return {
    id: data.id || "msg_" + Date.now(),
    type: "message",
    role: "assistant",
    content: [{ type: "text", text }],
    model: data.model || mappedModel,
    stop_reason: data?.choices?.[0]?.finish_reason || "end_turn",
  };
}

async function callOpenClaude({ messages, model, options }) {
  const groqCredentials = getGroqCredentials(options);
  const groqApiKey = groqCredentials.apiKey;
  const openRouterApiKey = process.env.OPENROUTER_API_KEY;
  const openClaudeApiKey = process.env.OPENCLAUDE_API_KEY;
  const defaultModel = groqApiKey ? groqCredentials.model : "claude-3-sonnet-20240229";

  if (groqCredentials.isHomepageSurface && !groqApiKey) {
    const error = new Error("HOME_GROQ_API_KEY is missing for the homepage chatbot.");
    error.status = 500;
    throw error;
  }

  console.debug("[callOpenClaude] Using API:", {
    isHomepage: groqCredentials.isHomepageSurface,
    usingGroq: Boolean(groqApiKey),
    groqModel: groqCredentials.model,
  });

  if (groqApiKey) {
    return callViaGroq({ messages, model, options, apiKey: groqApiKey });
  }

  if (openRouterApiKey) {
    if (!openRouterApiKey.startsWith("sk-or-v1-")) {
      const error = new Error("OPENROUTER_API_KEY appears invalid. Expected a key starting with sk-or-v1-");
      error.status = 500;
      throw error;
    }

    return callViaOpenRouter({ messages, model, options, apiKey: openRouterApiKey });
  }

  const apiKey = openClaudeApiKey;

  if (!apiKey) {
    const userMessage = messages?.[messages.length - 1]?.content || "";
    return {
      id: "demo_" + Date.now(),
      type: "message",
      role: "assistant",
      content: [
        {
          type: "text",
          text: `Demo mode: no AI API key configured yet. You said: ${userMessage}`,
        },
      ],
      model: model || defaultModel,
      stop_reason: "end_turn",
      demo_mode: true,
    };
  }

  const payload = {
    model: model || defaultModel,
    max_tokens: options?.maxTokens || 2048,
    temperature: options?.temperature ?? 0.7,
    messages: buildPromptedMessages(messages, options),
  };

  if (apiKey.startsWith("sk-or-v1-")) {
    return callViaOpenRouter({ messages, model, options, apiKey });
  }

  const response = await fetch(OPENCLAUDE_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json();

  if (!response.ok) {
    const error = new Error(data?.error?.message || response.statusText || "OpenClaude request failed");
    error.status = response.status;
    error.details = data;
    throw error;
  }

  return data;
}

function buildSalesCsrSystemPrompt(options = {}) {
  if (options?.promptMode === "lite") {
    return `You are a helpful business assistant.
Rules:
- Answer directly and briefly.
- Use the business Products/Services when asked about offers.
- If link is missing, say it is not available.
- Do not invent details.
- Match the user's language.`;
  }

  return `You are a human-like business assistant trained for two primary roles:
1) Sales Agent
2) Customer Service Representative (CSR)

Core behavior:
- Be clear, concise, and professional.
- Ask focused follow-up questions when context is missing.
- If the request is ambiguous, first clarify objective, audience, and urgency.
- Use practical, action-oriented outputs (scripts, templates, checklists, next steps).

Language and tone:
- Detect the user's language and reply in the same language by default.
- Support multilingual conversations naturally, including mixed English/Tagalog and other languages.
- Sound human, warm, and conversational, especially for chat and Facebook messages.
- Avoid robotic or repetitive phrasing.
- Do not introduce yourself with a fixed bot name unless the user explicitly asks for your name.
- Add 0-2 light emoticons in a reply when it fits the tone (e.g., 🙂, 😊, 🙏). Avoid overusing them.

When acting as Sales Agent:
- Help with lead qualification, discovery questions, objection handling, pricing communication, proposal messaging, and deal progression.
- Recommend upsell/cross-sell options only when they genuinely fit customer needs.
- Prioritize value, trust, and long-term relationships over aggressive tactics.

When acting as CSR:
- Show empathy and acknowledge customer concerns.
- De-escalate frustration, apologize when appropriate, and provide clear resolution steps.
- Collect required details efficiently and provide realistic timelines.
- Offer alternatives or escalation paths when immediate resolution is not possible.

Response format preference:
- Start with a direct answer.
- Follow with short bullets for steps/actions.
- End with one concise follow-up question when needed.

Identity handling:
- If asked whether you are AI or human, reply naturally: you are the page's support assistant helping with inquiries.
- Keep identity answers short, friendly, and non-technical.

Knowledge usage priority:
- Prioritize the business Products/Services context when users ask what the business offers.
- For product-related questions, answer from listed products/services first before giving generic suggestions.
- If products/services are missing, say that there is no listed product information yet and offer to connect the user with a staff member.

Missing link handling:
- If website link is unavailable, say: "Sa ngayon, wala pa kaming website link."
- If Shopee link is unavailable, say: "Sa ngayon, wala pa kaming Shopee link."
- If Lazada link is unavailable, say: "Sa ngayon, wala pa kaming Lazada link."

Never invent company policies, pricing, or guarantees. If data is missing, say what is needed.`;
}

function getLatestUserMessage(messages = []) {
  for (let i = messages.length - 1; i >= 0; i -= 1) {
    if (messages[i]?.role === "user") {
      return typeof messages[i].content === "string" ? messages[i].content : String(messages[i].content || "");
    }
  }
  return "";
}

function normalizeContextValue(value) {
  return typeof value === "string" ? value.trim() : "";
}

function getGroqCredentials(options = {}) {
  const isHomepageSurface = normalizeContextValue(options?.surface) === "homepage";

  if (isHomepageSurface) {
    return {
      apiKey: process.env.HOME_GROQ_API_KEY || "",
      model: process.env.HOME_GROQ_MODEL || process.env.GROQ_MODEL || "llama-3.3-70b-versatile",
      isHomepageSurface: true,
    };
  }

  return {
    apiKey: process.env.GROQ_API_KEY || process.env.XAI_API_KEY || "",
    model: process.env.GROQ_MODEL || "llama-3.3-70b-versatile",
    isHomepageSurface: false,
  };
}

function buildBusinessContextMessages(options = {}) {
  const businessType = normalizeContextValue(options?.businessType);
  const pageName = normalizeContextValue(options?.pageName);
  const productServices = normalizeContextValue(options?.productServices);
  const productServicePriceRanges = normalizeContextValue(options?.productServicePriceRanges);
  const websiteLink = normalizeContextValue(options?.websiteLink);
  const shoppeLink = normalizeContextValue(options?.shoppeLink);
  const lazadaLink = normalizeContextValue(options?.lazadaLink);

  const productServicesValue = productServices || "not available";
  const productServicePriceRangesValue = productServicePriceRanges || "not available";
  const websiteLinkValue = websiteLink || "not available";
  const shoppeLinkValue = shoppeLink || "not available";
  const lazadaLinkValue = lazadaLink || "not available";

  if (!businessType && !pageName && !productServices && !productServicePriceRanges && !websiteLink && !shoppeLink && !lazadaLink) {
    return [];
  }

  const contextParts = [];

  if (pageName) {
    contextParts.push(`Facebook page: ${pageName}`);
  }

  if (businessType) {
    contextParts.push(`Business type: ${businessType}`);
  }

  contextParts.push(`Products/Services: ${productServicesValue}`);
  contextParts.push(`Product/service price range: ${productServicePriceRangesValue}`);
  contextParts.push(`Website link: ${websiteLinkValue}`);
  contextParts.push(`Shopee link: ${shoppeLinkValue}`);
  contextParts.push(`Lazada link: ${lazadaLinkValue}`);

  contextParts.push(
    "Use this business context to guide replies. Prioritize Products/Services details for offer/product questions. If Website/Shopee/Lazada value is 'not available', clearly say the page currently has no link for that channel. Do not invent missing links or product details."
  );

  return [
    {
      role: "system",
      content: contextParts.join("\n"),
    },
  ];
}

function buildChannelStyleMessages(options = {}) {
  if (options?.channel !== "facebook") {
    return [];
  }

  return [
    {
      role: "system",
      content: `Channel style for Facebook Messenger:
- Reply like a real person in chat: natural, warm, and direct.
- Keep replies short by default: 1-3 sentences, max 80 words.
- Mirror the user's language style (Tagalog, English, or Taglish).
- Add a small, friendly emoticon when appropriate (0-2 max).
- Do not use meta phrases like "Based on the context provided", "Here's a possible response", or "As an AI".
- Do not output long templates, numbered lists, or formal scripts unless the user asks for detailed format.
- Give one clear answer, then ask one short follow-up question only when needed.`,
    },
  ];
}

function isInSupportedScope(text, options = {}) {
  if (!options || Object.keys(options).length === 0) {
    return true;
  }

  if (options?.channel === "facebook" || options?.multilingual === true) {
    return true;
  }

  if (
    options?.businessType ||
    options?.pageName ||
    options?.productServices ||
    options?.productServicePriceRanges ||
    options?.websiteLink ||
    options?.shoppeLink ||
    options?.lazadaLink
  ) {
    return true;
  }

  const value = (text || "").toLowerCase();
  return TOPIC_KEYWORDS.some((keyword) => value.includes(keyword));
}

function buildOutOfScopeResponse(model) {
  return {
    id: "restricted_" + Date.now(),
    type: "message",
    role: "assistant",
    content: [
      {
        type: "text",
        text: `I can only help with: ${SUPPORTED_TOPICS.join(", ")}.`,
      },
    ],
    model: model || DEFAULT_MODEL,
    stop_reason: "end_turn",
    restricted: true,
  };
}

function buildBusinessContextFallback(model, options = {}) {
  const pageName = typeof options.pageName === "string" ? options.pageName.trim() : "";
  const productServices = typeof options.productServices === "string" ? options.productServices.trim() : "";
  const websiteLink = typeof options.websiteLink === "string" ? options.websiteLink.trim() : "";
  const shoppeLink = typeof options.shoppeLink === "string" ? options.shoppeLink.trim() : "";
  const lazadaLink = typeof options.lazadaLink === "string" ? options.lazadaLink.trim() : "";

  const parts = [];
  if (pageName) {
    parts.push(`Here is what ${pageName} offers:`);
  } else {
    parts.push("Here are our services:");
  }

  if (productServices) {
    parts.push(productServices);
  } else {
    parts.push("We don't have listed services yet. Please ask our team for details.");
  }

  if (websiteLink) parts.push(`Website: ${websiteLink}`);
  if (shoppeLink) parts.push(`Shopee: ${shoppeLink}`);
  if (lazadaLink) parts.push(`Lazada: ${lazadaLink}`);

  return {
    id: "context_" + Date.now(),
    type: "message",
    role: "assistant",
    content: [{ type: "text", text: parts.join(" ") }],
    model: model || DEFAULT_MODEL,
    stop_reason: "end_turn",
  };
}

function normalizeMessages(messages = []) {
  return messages.map((m) => ({
    role: m.role,
    content: typeof m.content === "string" ? m.content : String(m.content || ""),
  }));
}

function buildPromptedMessages(messages = [], options = {}) {
  return [
    { role: "system", content: buildSalesCsrSystemPrompt(options) },
    ...buildBusinessContextMessages(options),
    ...buildChannelStyleMessages(options),
    ...normalizeMessages(messages),
  ];
}

async function callViaOpenRouter({ messages, model, options, apiKey }) {
  const mappedModel = OPENROUTER_MODEL_MAP[model] || model || "anthropic/claude-3.5-sonnet";

  const buildPayload = (selectedModel) => ({
    model: selectedModel,
    messages: buildPromptedMessages(messages, options),
    max_tokens: options?.maxTokens || 2048,
    temperature: options?.temperature ?? 0.7,
  });

  let response = await fetch(OPENROUTER_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(buildPayload(mappedModel)),
  });

  let data = await response.json();

  if (!response.ok && response.status === 404) {
    response = await fetch(OPENROUTER_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(buildPayload("openrouter/auto")),
    });
    data = await response.json();
  }

  if (!response.ok) {
    const error = new Error(data?.error?.message || response.statusText || "OpenRouter request failed");
    error.status = response.status;
    error.details = data;
    throw error;
  }

  const text = data?.choices?.[0]?.message?.content || "No response text returned.";
  return {
    id: data.id || "msg_" + Date.now(),
    type: "message",
    role: "assistant",
    content: [{ type: "text", text }],
    model: data.model || mappedModel,
    stop_reason: data?.choices?.[0]?.finish_reason || "end_turn",
  };
}

async function callViaGroq({ messages, model, options, apiKey }) {
  const mappedModel = GROQ_MODEL_MAP[model] || (isGroqCompatibleModel(model) ? model : DEFAULT_GROQ_MODEL);

  const buildPayload = (selectedModel) => ({
    model: selectedModel,
    messages: buildPromptedMessages(messages, options),
    max_tokens: options?.maxTokens || 1024,
    temperature: options?.temperature ?? 0.7,
  });

  const response = await fetch(GROQ_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(buildPayload(mappedModel)),
  });

  const data = await response.json();

  if (!response.ok) {
    const error = new Error(data?.error?.message || response.statusText || "Groq request failed");
    error.status = response.status;
    error.details = data;
    throw error;
  }

  const text = data?.choices?.[0]?.message?.content || "No response text returned.";
  return {
    id: data.id || "msg_" + Date.now(),
    type: "message",
    role: "assistant",
    content: [{ type: "text", text }],
    model: data.model || mappedModel,
    stop_reason: data?.choices?.[0]?.finish_reason || "end_turn",
  };
}

async function callOpenClaude({ messages, model, options }) {
  const groqApiKey = process.env.GROQ_API_KEY || process.env.XAI_API_KEY;
  const openRouterApiKey = process.env.OPENROUTER_API_KEY;
  const openClaudeApiKey = process.env.OPENCLAUDE_API_KEY;

  if (groqApiKey) {
    return callViaGroq({ messages, model, options, apiKey: groqApiKey });
  }

  if (openRouterApiKey) {
    if (!openRouterApiKey.startsWith("sk-or-v1-")) {
      const error = new Error("OPENROUTER_API_KEY appears invalid. Expected a key starting with sk-or-v1-");
      error.status = 500;
      throw error;
    }

    return callViaOpenRouter({ messages, model, options, apiKey: openRouterApiKey });
  }

  const apiKey = openClaudeApiKey;

  if (!apiKey) {
    const userMessage = messages?.[messages.length - 1]?.content || "";
    return {
      id: "demo_" + Date.now(),
      type: "message",
      role: "assistant",
      content: [
        {
          type: "text",
          text: `Demo mode: no AI API key configured yet. You said: ${userMessage}`,
        },
      ],
      model: model || DEFAULT_MODEL,
      stop_reason: "end_turn",
      demo_mode: true,
    };
  }

  const payload = {
    model: model || DEFAULT_MODEL,
    max_tokens: options?.maxTokens || 1024,
    temperature: options?.temperature ?? 0.7,
    messages: buildPromptedMessages(messages, options),
  };

  if (apiKey.startsWith("sk-or-v1-")) {
    return callViaOpenRouter({ messages, model, options, apiKey });
  }

  const response = await fetch(OPENCLAUDE_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json();

  if (!response.ok) {
    const error = new Error(data?.error?.message || response.statusText || "OpenClaude request failed");
    error.status = response.status;
    error.details = data;
    throw error;
  }

  return data;
}

// OpenClaude Service Routes
router.get("/health", (req, res) => {
  const provider = process.env.GROQ_API_KEY || process.env.XAI_API_KEY
    ? "groq"
    : process.env.OPENROUTER_API_KEY
    ? "openrouter"
    : process.env.OPENCLAUDE_API_KEY
    ? "anthropic"
    : "demo";

  res.json({
    status: "healthy",
    service: "OpenClaude",
    provider,
    configured: Boolean(process.env.GROQ_API_KEY || process.env.XAI_API_KEY || process.env.OPENROUTER_API_KEY || process.env.OPENCLAUDE_API_KEY),
    timestamp: new Date().toISOString()
  });
});

router.post("/chat", async (req, res) => {
  const { messages, model, options } = req.body;

  try {
    console.debug("[openclaude/chat] options", {
      surface: typeof options?.surface === "string" ? options.surface : null,
      hasOptions: Boolean(options),
      pageName: typeof options?.pageName === "string" ? options.pageName : null,
      businessType: typeof options?.businessType === "string" ? options.businessType : null,
      productServices: typeof options?.productServices === "string"
        ? options.productServices.slice(0, 200)
        : null,
      productServicePriceRanges:
        typeof options?.productServicePriceRanges === "string"  ? options.productServicePriceRanges : null,
      websiteLink: typeof options?.websiteLink === "string" ? options.websiteLink : null,
      shoppeLink: typeof options?.shoppeLink === "string" ? options.shoppeLink : null,
      lazadaLink: typeof options?.lazadaLink === "string" ? options.lazadaLink : null,
    });
  } catch (e) {
    /* ignore logging errors */
  }

  if (!Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: "messages array is required" });
  }

  const latestUserText = getLatestUserMessage(messages);
  if (!isInSupportedScope(latestUserText, options || {})) {
    const hasContext = Boolean(
      options?.businessType ||
        options?.pageName ||
        options?.productServices ||
        options?.websiteLink ||
        options?.shoppeLink ||
        options?.lazadaLink
    );
    if (hasContext) {
      return res.status(200).json(buildBusinessContextFallback(model, options));
    }

    return res.status(200).json(buildOutOfScopeResponse(model));
  }

  try {
    const data = await callOpenClaude({ messages, model, options });
    return res.status(200).json(data);
  } catch (error) {
    console.error("OpenClaude /chat error:", error);
    return res.status(error.status || 500).json({
      error: "Failed to call OpenClaude API",
      message: error.message,
      details: error.details || null,
    });
  }
});

router.post("/crm-insights", (req, res) => {
  const { customerData } = req.body;

  // TODO: Generate actual CRM insights using OpenClaude
  res.json({
    content: [
      {
        type: "text",
        text: "CRM insights generated successfully. Integrate with OpenClaude for actual analysis."
      }
    ]
  });
});

router.post("/erp-docs", (req, res) => {
  const { context } = req.body;

  // TODO: Generate actual ERP documentation using OpenClaude
  res.json({
    content: [
      {
        type: "text",
        text: "ERP documentation generated successfully. Integrate with OpenClaude for actual generation."
      }
    ]
  });
});

router.post("/analytics-insights", (req, res) => {
  const { data } = req.body;

  // TODO: Generate actual analytics insights using OpenClaude
  res.json({
    content: [
      {
        type: "text",
        text: "Analytics insights generated successfully. Integrate with OpenClaude for actual analysis."
      }
    ]
  });
});

router.post("/market-research", (req, res) => {
  const { topic } = req.body;

  // TODO: Generate actual market research templates using OpenClaude
  res.json({
    content: [
      {
        type: "text",
        text: "Market research template generated successfully. Integrate with OpenClaude for actual generation."
      }
    ]
  });
});

module.exports = router;
