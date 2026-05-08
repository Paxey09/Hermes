/**
 * AI Routes - Groq LLM Integration
 * Replaces: openClaude
 */

const express = require('express');
const router = express.Router();

const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GROQ_API_URL = 'https://api.groq.com/openai/v1';
const ADMIN_CHATBOT_PROMPT = process.env.ADMIN_CHATBOT || '';

function buildAdminSystemPrompt() {
  const basePrompt = `You are Hermes Admin Sentinel, an AI diagnostics assistant for admins.

Primary goals:
- Detect bugs, data mismatches, risky configurations, and integration failures.
- Prioritize findings by severity: critical, high, medium, low.
- Provide actionable next steps with specific module/service names.
- Be concise and practical.

Output format:
1) Summary (2-4 lines)
2) Findings (bullet list, each with severity label)
3) Recommended actions (numbered list)
4) Optional follow-up checks`;

  if (!ADMIN_CHATBOT_PROMPT.trim()) {
    return basePrompt;
  }

  return `${basePrompt}\n\nAdditional admin instructions:\n${ADMIN_CHATBOT_PROMPT.trim()}`;
}

function normalizeHealth(input) {
  if (!input || typeof input !== 'object') {
    return { status: 'unknown' };
  }

  return {
    name: String(input.name || 'unknown-service'),
    status: String(input.status || 'unknown').toLowerCase(),
    detail: input.detail ? String(input.detail) : '',
  };
}

function deriveFindings(snapshot = {}) {
  const findings = [];
  const healthChecks = Array.isArray(snapshot.healthChecks) ? snapshot.healthChecks.map(normalizeHealth) : [];

  const unhealthy = healthChecks.filter((check) => check.status !== 'healthy');

  unhealthy.forEach((check) => {
    const severity = check.status === 'down' || check.status === 'unhealthy' ? 'high' : 'medium';
    findings.push({
      severity,
      title: `${check.name} is ${check.status}`,
      detail: check.detail || 'Service check did not return a healthy state.',
    });
  });

  if (!snapshot.currentModule || String(snapshot.currentModule).trim().length === 0) {
    findings.push({
      severity: 'low',
      title: 'Current admin module not detected',
      detail: 'Route context was not provided, so module-specific diagnosis may be less accurate.',
    });
  }

  const moduleStats = snapshot.moduleStats && typeof snapshot.moduleStats === 'object'
    ? snapshot.moduleStats
    : null;

  if (moduleStats && Number(moduleStats.totalModules || 0) > 0) {
    const unavailable = Number(moduleStats.unavailableModules || 0);
    if (unavailable > 0) {
      findings.push({
        severity: unavailable > 3 ? 'high' : 'medium',
        title: `${unavailable} admin module(s) unavailable`,
        detail: 'One or more modules failed local checks or route checks.',
      });
    }
  }

  if (findings.length === 0) {
    findings.push({
      severity: 'low',
      title: 'No obvious system mismatch detected in quick scan',
      detail: 'No unhealthy services or module availability issues were reported by the client snapshot.',
    });
  }

  return findings;
}

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

// Quick system scan data for admin assistant
router.get('/groq/admin/system-scan', (req, res) => {
  const memory = process.memoryUsage();

  res.json({
    server: {
      nodeEnv: process.env.NODE_ENV || 'development',
      uptimeSeconds: Math.floor(process.uptime()),
      rssMB: Math.round(memory.rss / (1024 * 1024)),
      heapUsedMB: Math.round(memory.heapUsed / (1024 * 1024)),
      heapTotalMB: Math.round(memory.heapTotal / (1024 * 1024)),
    },
    integrations: {
      groqConfigured: Boolean(GROQ_API_KEY),
      adminPromptConfigured: Boolean(ADMIN_CHATBOT_PROMPT.trim()),
    },
    timestamp: new Date().toISOString(),
  });
});

// Admin diagnostics chat for bug/mismatch analysis
router.post('/groq/admin/diagnostics', async (req, res) => {
  if (!GROQ_API_KEY) {
    return res.status(503).json({ error: 'Groq API not configured' });
  }

  try {
    const { message, module, snapshot = {}, options = {} } = req.body;

    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'message is required' });
    }

    const safeSnapshot = typeof snapshot === 'object' && snapshot ? snapshot : {};
    const findings = deriveFindings({ ...safeSnapshot, currentModule: module || safeSnapshot.currentModule });

    const diagnosticPrompt = `Admin request: ${message}\n\nCurrent module: ${module || 'unknown'}\n\nQuick findings from system scan:\n${JSON.stringify(findings, null, 2)}\n\nSystem snapshot:\n${JSON.stringify(safeSnapshot, null, 2)}\n\nProvide diagnosis focused on bugs, mismatches, and operational risk.`;

    const response = await fetch(`${GROQ_API_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GROQ_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: options.model || 'llama-3.1-70b-versatile',
        messages: [
          { role: 'system', content: buildAdminSystemPrompt() },
          { role: 'user', content: diagnosticPrompt },
        ],
        max_tokens: options.maxTokens || 1200,
        temperature: options.temperature ?? 0.3,
      }),
    });

    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({}));
      throw new Error(errorBody.error?.message || `Groq diagnostics error: ${response.status}`);
    }

    const data = await response.json();

    res.json({
      response: data.choices?.[0]?.message?.content || '',
      findings,
      model: data.model,
      usage: data.usage,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Admin diagnostics error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
