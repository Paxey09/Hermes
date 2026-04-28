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

  const buildSalesCsrSystemPrompt = () => {
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
    model: model || 'claude-3-sonnet-20240229',
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
      model: model || 'claude-3-sonnet-20240229',
      stop_reason: 'end_turn',
    };
  };

  const { endpoint, ...body } = req.body;

  const normalizeMessages = (messages = []) => messages.map((m) => ({
    role: m.role,
    content: typeof m.content === 'string' ? m.content : String(m.content || ''),
  }));

  const buildPromptedMessages = (messages = [], options = {}) => [
    { role: 'system', content: buildSalesCsrSystemPrompt() },
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

  const apiKey = process.env.OPENCLAUDE_API_KEY || process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    const userMessage = body?.messages?.[body.messages.length - 1]?.content || '';
    return res.status(200).json({
      id: 'demo_' + Date.now(),
      type: 'message',
      role: 'assistant',
      content: [
        {
          type: 'text',
          text: `Demo mode: no OPENCLAUDE_API_KEY configured yet. You said: ${userMessage}`,
        },
      ],
      model: body?.model || 'claude-3-sonnet-20240229',
      stop_reason: 'end_turn',
      demo_mode: true,
    });
  }

  const useOpenRouter = apiKey.startsWith('sk-or-v1-');

  try {
    const targetUrl = useOpenRouter
      ? 'https://openrouter.ai/api/v1/chat/completions'
      : `https://api.anthropic.com/v1${endpoint}`;

    const mappedModel = body?.model === 'claude-3-sonnet-20240229'
      ? 'anthropic/claude-3.5-sonnet'
      : body?.model;

    const openRouterPayload = {
      model: mappedModel || 'anthropic/claude-3.5-sonnet',
      messages: buildPromptedMessages(body?.messages || [], body?.options || {}),
      max_tokens: body?.max_tokens || 1024,
      temperature: body?.temperature ?? 0.7,
    };

    const anthropicPayload = {
      ...body,
      messages: buildPromptedMessages(body?.messages || [], body?.options || {}),
    };

    const runRequest = async (payload) => fetch(targetUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(useOpenRouter
          ? { Authorization: `Bearer ${apiKey}` }
          : {
              'x-api-key': apiKey,
              'anthropic-version': '2023-06-01',
            }),
      },
      body: JSON.stringify(payload),
    });

    let response = await runRequest(useOpenRouter ? openRouterPayload : anthropicPayload);
    let data = await response.json();

    if (useOpenRouter && !response.ok && response.status === 404) {
      response = await runRequest({ ...openRouterPayload, model: 'openrouter/auto' });
      data = await response.json();
    }

    if (!response.ok) {
      return res.status(response.status).json(data);
    }

    if (useOpenRouter) {
      const text = data?.choices?.[0]?.message?.content || 'No response text returned.';
      return res.status(200).json({
        id: data.id || 'msg_' + Date.now(),
        type: 'message',
        role: 'assistant',
        content: [{ type: 'text', text }],
        model: data.model || openRouterPayload.model,
        stop_reason: data?.choices?.[0]?.finish_reason || 'end_turn',
      });
    }

    res.status(200).json(data);
  } catch (error) {
    console.error('OpenClaude API error:', error);
    res.status(500).json({ error: 'Failed to call OpenClaude API', message: error.message });
  }
}
