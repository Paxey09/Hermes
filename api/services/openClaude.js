export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const SUPPORTED_TOPICS = [
    'CRM',
    'ERP',
    'Appointment Booking',
    'Data Analytics & Market Research',
    'Email Marketing',
    'Sales',
    'Customer Service',
  ];

  const TOPIC_KEYWORDS = [
    'crm',
    'customer relationship',
    'lead',
    'sales pipeline',
    'sales',
    'selling',
    'upsell',
    'cross-sell',
    'proposal',
    'quotation',
    'quote',
    'pricing',
    'negotiation',
    'deal',
    'conversion',
    'erp',
    'enterprise resource planning',
    'inventory',
    'procurement',
    'appointment',
    'booking',
    'schedule',
    'calendar',
    'data analytics',
    'analytics',
    'market research',
    'market analysis',
    'email marketing',
    'newsletter',
    'campaign',
    'email campaign',
    'customer support',
    'customer service',
    'service request',
    'complaint',
    'ticket',
    'refund',
    'billing',
    'subscription',
    'onboarding',
    'retention',
    'csr',
    'suporta',
    'serbisyo',
    'benta',
    'kliyente',
    'customer',
    'order',
    'bayad',
    'tanong',
  ];

  const buildSalesCsrSystemPrompt = (options = {}) => {
    if (options?.promptMode === 'lite') {
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
  };

  const getLatestUserMessage = (messages = []) => {
    for (let i = messages.length - 1; i >= 0; i -= 1) {
      if (messages[i]?.role === 'user') {
        return typeof messages[i].content === 'string' ? messages[i].content : String(messages[i].content || '');
      }
    }
    return '';
  };

  const isInSupportedScope = (text, options = {}) => {
    if (!options || Object.keys(options).length === 0) {
      return true;
    }

    if (options?.channel === 'facebook' || options?.multilingual === true) {
      return true;
    }

    if (
      options?.businessType ||
      options?.pageName ||
      options?.productServices ||
      options?.websiteLink ||
      options?.shoppeLink ||
      options?.lazadaLink
    ) {
      return true;
    }

    const value = (text || '').toLowerCase();
    return TOPIC_KEYWORDS.some((keyword) => value.includes(keyword));
  };

  const normalizeContextValue = (value) => (typeof value === 'string' ? value.trim() : '');

  const buildBusinessContextMessages = (options = {}) => {
    const businessType = normalizeContextValue(options?.businessType);
    const pageName = normalizeContextValue(options?.pageName);
    const productServices = normalizeContextValue(options?.productServices);
    const websiteLink = normalizeContextValue(options?.websiteLink);
    const shoppeLink = normalizeContextValue(options?.shoppeLink);
    const lazadaLink = normalizeContextValue(options?.lazadaLink);

    const productServicesValue = productServices || 'not available';
    const websiteLinkValue = websiteLink || 'not available';
    const shoppeLinkValue = shoppeLink || 'not available';
    const lazadaLinkValue = lazadaLink || 'not available';

    if (!businessType && !pageName && !productServices && !websiteLink && !shoppeLink && !lazadaLink) {
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
    contextParts.push(`Website link: ${websiteLinkValue}`);
    contextParts.push(`Shopee link: ${shoppeLinkValue}`);
    contextParts.push(`Lazada link: ${lazadaLinkValue}`);

    contextParts.push('Use this business context to guide replies. Prioritize Products/Services details for offer/product questions. If Website/Shopee/Lazada value is \"not available\", clearly say the page currently has no link for that channel. Do not invent missing links or product details.');

    return [{
      role: 'system',
      content: contextParts.join('\n'),
    }];
  };

  const buildChannelStyleMessages = (options = {}) => {
    if (options?.channel !== 'facebook') {
      return [];
    }

    return [{
      role: 'system',
      content: `Channel style for Facebook Messenger:
- Reply like a real person in chat: natural, warm, and direct.
- Keep replies short by default: 1-3 sentences, max 80 words.
- Mirror the user's language style (Tagalog, English, or Taglish).
- Do not use meta phrases like "Based on the context provided", "Here's a possible response", or "As an AI".
- Do not output long templates, numbered lists, or formal scripts unless the user asks for detailed format.
- Give one clear answer, then ask one short follow-up question only when needed.`,
    }];
  };

  const buildOutOfScopeResponse = (model) => ({
    id: 'restricted_' + Date.now(),
    type: 'message',
    role: 'assistant',
    content: [
      {
        type: 'text',
        text: `I can only help with: ${SUPPORTED_TOPICS.join(', ')}.`,
      },
    ],
    model: model || (process.env.XAI_API_KEY ? 'grok-2-latest' : 'claude-3-sonnet-20240229'),
    stop_reason: 'end_turn',
    restricted: true,
  });

  const buildBusinessContextFallback = (model, options = {}) => {
    const pageName = typeof options.pageName === 'string' ? options.pageName.trim() : '';
    const productServices = typeof options.productServices === 'string' ? options.productServices.trim() : '';
    const websiteLink = typeof options.websiteLink === 'string' ? options.websiteLink.trim() : '';
    const shoppeLink = typeof options.shoppeLink === 'string' ? options.shoppeLink.trim() : '';
    const lazadaLink = typeof options.lazadaLink === 'string' ? options.lazadaLink.trim() : '';

    const parts = [];
    if (pageName) {
      parts.push(`Here is what ${pageName} offers:`);
    } else {
      parts.push('Here are our services:');
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
      id: 'context_' + Date.now(),
      type: 'message',
      role: 'assistant',
      content: [{ type: 'text', text: parts.join(' ') }],
      model: model || (process.env.XAI_API_KEY ? 'grok-2-latest' : 'claude-3-sonnet-20240229'),
      stop_reason: 'end_turn',
    };
  };

  const { endpoint, ...body } = req.body;

  try {
    const options = body?.options || {};
    console.debug('[api/openclaude] options', {
      hasOptions: Boolean(options),
      pageName: typeof options?.pageName === 'string' ? options.pageName : null,
      businessType: typeof options?.businessType === 'string' ? options.businessType : null,
      productServices: typeof options?.productServices === 'string'
        ? options.productServices.slice(0, 200)
        : null,
      websiteLink: typeof options?.websiteLink === 'string' ? options.websiteLink : null,
      shoppeLink: typeof options?.shoppeLink === 'string' ? options.shoppeLink : null,
      lazadaLink: typeof options?.lazadaLink === 'string' ? options.lazadaLink : null,
    });
  } catch (e) {
    /* ignore logging errors */
  }

  const normalizeMessages = (messages = []) => messages.map((m) => ({
    role: m.role,
    content: typeof m.content === 'string' ? m.content : String(m.content || ''),
  }));

  const buildPromptedMessages = (messages = [], options = {}) => [
    { role: 'system', content: buildSalesCsrSystemPrompt(options) },
    ...buildBusinessContextMessages(options),
    ...buildChannelStyleMessages(options),
    ...normalizeMessages(messages),
  ];

  const latestUserText = getLatestUserMessage(body?.messages || []);
  if (!isInSupportedScope(latestUserText, body?.options || {})) {
    const hasContext = Boolean(
      body?.options?.businessType ||
        body?.options?.pageName ||
        body?.options?.productServices ||
        body?.options?.websiteLink ||
        body?.options?.shoppeLink ||
        body?.options?.lazadaLink
    );
    if (hasContext) {
      return res.status(200).json(buildBusinessContextFallback(body?.model, body?.options || {}));
    }

    return res.status(200).json(buildOutOfScopeResponse(body?.model));
  }

  const groqApiKey = process.env.GROQ_API_KEY || process.env.XAI_API_KEY;
  const openRouterApiKey = process.env.OPENROUTER_API_KEY;
  const anthropicApiKey = process.env.OPENCLAUDE_API_KEY || process.env.ANTHROPIC_API_KEY;
  const defaultGroqModel = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';
  const defaultModel = groqApiKey ? defaultGroqModel : 'claude-3-sonnet-20240229';

  if (!groqApiKey && !openRouterApiKey && !anthropicApiKey) {
    const userMessage = body?.messages?.[body.messages.length - 1]?.content || '';
    return res.status(200).json({
      id: 'demo_' + Date.now(),
      type: 'message',
      role: 'assistant',
      content: [
        {
          type: 'text',
          text: `Demo mode: no AI API key configured yet. You said: ${userMessage}`,
        },
      ],
      model: body?.model || defaultModel,
      stop_reason: 'end_turn',
      demo_mode: true,
    });
  }

  const provider = groqApiKey ? 'groq' : openRouterApiKey ? 'openrouter' : 'anthropic';

  try {
    const targetUrl = provider === 'groq'
      ? 'https://api.groq.com/openai/v1/chat/completions'
      : provider === 'openrouter'
      ? 'https://openrouter.ai/api/v1/chat/completions'
      : `https://api.anthropic.com/v1${endpoint}`;

    const mappedModel = provider === 'groq'
      ? {
          'claude-3-sonnet-20240229': defaultGroqModel,
          'claude-3-opus-20240229': defaultGroqModel,
          'claude-3-haiku-20240307': defaultGroqModel,
          'openai/gpt-4o-mini': defaultGroqModel,
          'gpt-4o-mini': defaultGroqModel,
          'openai/gpt-4o': defaultGroqModel,
          'gpt-4o': defaultGroqModel,
          'grok-2-latest': defaultGroqModel,
          'grok-4.20': defaultGroqModel,
        }[body?.model] || body?.model || defaultGroqModel
      : provider === 'openrouter'
      ? {
          'claude-3-sonnet-20240229': 'anthropic/claude-3.5-sonnet',
          'claude-3-opus-20240229': 'anthropic/claude-3-opus',
          'claude-3-haiku-20240307': 'anthropic/claude-3-haiku',
        }[body?.model] || body?.model || 'anthropic/claude-3.5-sonnet'
      : body?.model || defaultModel;

    const sharedPayload = {
      model: mappedModel,
      messages: buildPromptedMessages(body?.messages || [], body?.options || {}),
      max_tokens: body?.max_tokens || 1024,
      temperature: body?.temperature ?? 0.7,
    };

    const anthropicPayload = {
      ...body,
      messages: sharedPayload.messages,
    };

    const runRequest = async (payload) => fetch(targetUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(provider === 'groq' || provider === 'openrouter'
          ? { Authorization: `Bearer ${provider === 'groq' ? groqApiKey : openRouterApiKey}` }
          : {
              'x-api-key': anthropicApiKey,
              'anthropic-version': '2023-06-01',
            }),
      },
      body: JSON.stringify(payload),
    });

    let response = await runRequest(provider === 'anthropic' ? anthropicPayload : sharedPayload);
    let data = await response.json();

    if (provider === 'openrouter' && !response.ok && response.status === 404) {
      response = await runRequest({ ...sharedPayload, model: 'openrouter/auto' });
      data = await response.json();
    }

    if (!response.ok) {
      return res.status(response.status).json(data);
    }

    if (provider === 'groq' || provider === 'openrouter') {
      const text = data?.choices?.[0]?.message?.content || 'No response text returned.';
      return res.status(200).json({
        id: data.id || 'msg_' + Date.now(),
        type: 'message',
        role: 'assistant',
        content: [{ type: 'text', text }],
        model: data.model || sharedPayload.model,
        stop_reason: data?.choices?.[0]?.finish_reason || 'end_turn',
      });
    }

    res.status(200).json(data);
  } catch (error) {
    console.error('OpenClaude API error:', error);
    res.status(500).json({ error: 'Failed to call OpenClaude API', message: error.message });
  }
}
