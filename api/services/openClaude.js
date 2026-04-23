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
  ];

  const TOPIC_KEYWORDS = [
    'crm',
    'customer relationship',
    'lead',
    'sales pipeline',
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
  ];

  const getLatestUserMessage = (messages = []) => {
    for (let i = messages.length - 1; i >= 0; i -= 1) {
      if (messages[i]?.role === 'user') {
        return typeof messages[i].content === 'string' ? messages[i].content : String(messages[i].content || '');
      }
    }
    return '';
  };

  const isInSupportedScope = (text) => {
    const value = (text || '').toLowerCase();
    return TOPIC_KEYWORDS.some((keyword) => value.includes(keyword));
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

  const { endpoint, ...body } = req.body;
  const latestUserText = getLatestUserMessage(body?.messages || []);
  if (!isInSupportedScope(latestUserText)) {
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
      messages: (body?.messages || []).map((m) => ({
        role: m.role,
        content: typeof m.content === 'string' ? m.content : String(m.content || ''),
      })),
      max_tokens: body?.max_tokens || 1024,
      temperature: body?.temperature ?? 0.7,
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

    let response = await runRequest(useOpenRouter ? openRouterPayload : body);
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
