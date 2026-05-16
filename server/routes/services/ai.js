/**
 * AI Routes - Groq LLM Integration
 * Replaces: openClaude
 */

const express = require('express');
const router = express.Router();

const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GROQ_API_URL = 'https://api.groq.com/openai/v1';

// Health check
router.get('/health', async (req, res) => {
  if (!GROQ_API_KEY) {
    return res.status(503).json({
      status: 'unconfigured',
      message: 'GROQ_API_KEY not set in environment',
    });
  }

  try {
    const start = Date.now();
    const response = await fetch(`${GROQ_API_URL}/models`, {
      headers: {
        'Authorization': `Bearer ${GROQ_API_KEY}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Groq API error: ${response.status}`);
    }

    const latency = Date.now() - start;

    res.json({
      status: 'healthy',
      latency: `${latency}ms`,
      model: 'llama-3.1-8b-instant',
    });
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      error: error.message,
    });
  }
});

// Chat completion
router.post('/chat', async (req, res) => {
  if (!GROQ_API_KEY) {
    return res.status(503).json({ error: 'Groq API not configured' });
  }

  try {
    const { message, options = {} } = req.body;

    const response = await fetch(`${GROQ_API_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GROQ_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: options.model || 'llama-3.1-8b-instant',
        messages: [{ role: 'user', content: message }],
        max_tokens: options.maxTokens || 1024,
        temperature: options.temperature || 0.7,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Groq API error');
    }

    const data = await response.json();

    res.json({
      response: data.choices[0]?.message?.content || '',
      model: data.model,
      usage: data.usage,
    });
  } catch (error) {
    console.error('Groq chat error:', error);
    res.status(500).json({ error: error.message });
  }
});

// CRM Insights
router.post('/crm-insights', async (req, res) => {
  if (!GROQ_API_KEY) {
    return res.status(503).json({ error: 'Groq API not configured' });
  }

  try {
    const { customerData } = req.body;

    const prompt = `Analyze this customer data and provide insights:
${JSON.stringify(customerData, null, 2)}

Provide JSON with: sentiment (string), actions (array), risk (string), opportunities (array)`;

    const response = await fetch(`${GROQ_API_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GROQ_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.1-70b-versatile',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 1024,
        temperature: 0.5,
        response_format: { type: 'json_object' },
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to generate insights');
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content || '{}';

    try {
      const insights = JSON.parse(content);
      res.json(insights);
    } catch {
      res.json({ rawResponse: content });
    }
  } catch (error) {
    console.error('CRM insights error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
