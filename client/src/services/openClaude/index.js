/**
 * OpenClaude Service - Intelligence Layer
 * Provides AI-powered features for chatbot, CRM, ERP, and analytics
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

class OpenClaudeService {
  constructor() {
    this.baseUrl = API_BASE_URL;
  }

  /**
   * Generic API request handler
   */
  async request(endpoint, options = {}) {
    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('OpenClaude service error:', error);
      throw error;
    }
  }

  /**
   * Chat completion for Hermes Chatbot
   */
  async chatCompletion(messages, model = 'claude-3-sonnet-20240229', options = {}) {
    return this.request('/services/openClaude', {
      method: 'POST',
      body: JSON.stringify({
        endpoint: '/messages',
        model,
        max_tokens: options.maxTokens || 1024,
        messages,
        temperature: options.temperature || 0.7,
      }),
    });
  }

  /**
   * Generate CRM insights and recommendations
   */
  async generateCRMInsights(customerData, options = {}) {
    const prompt = `Analyze the following customer data and provide insights:
${JSON.stringify(customerData)}

Provide:
1. Customer sentiment analysis
2. Recommended actions
3. Risk assessment
4. Opportunity identification`;

    return this.chatCompletion([{ role: 'user', content: prompt }], 'claude-3-sonnet-20240229', options);
  }

  /**
   * Generate ERP documentation
   */
  async generateERPDocs(context, options = {}) {
    const prompt = `Generate comprehensive documentation for the following ERP context:
${JSON.stringify(context)}

Include:
1. Process overview
2. Step-by-step procedures
3. Best practices
4. Common issues and solutions`;

    return this.chatCompletion([{ role: 'user', content: prompt }], 'claude-3-opus-20240229', options);
  }

  /**
   * Generate analytics insights
   */
  async generateAnalyticsInsights(data, options = {}) {
    const prompt = `Analyze the following business data and provide actionable insights:
${JSON.stringify(data)}

Provide:
1. Key trends
2. Performance metrics
3. Recommendations
4. Forecast predictions`;

    return this.chatCompletion([{ role: 'user', content: prompt }], 'claude-3-sonnet-20240229', options);
  }

  /**
   * Generate market research templates
   */
  async generateMarketResearch(topic, options = {}) {
    const prompt = `Create a comprehensive market research template for: ${topic}

Include:
1. Research objectives
2. Target audience analysis
3. Competitor analysis framework
4. Data collection methods
5. Analysis templates`;

    return this.chatCompletion([{ role: 'user', content: prompt }], 'claude-3-opus-20240229', options);
  }

  /**
   * Stream chat responses for real-time chatbot
   */
  async streamChat(messages, onChunk, model = 'claude-3-sonnet-20240229') {
    try {
      const response = await fetch(`${this.baseUrl}/services/openClaude`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          endpoint: '/messages',
          model,
          max_tokens: 1024,
          messages,
          stream: true,
        }),
      });

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        onChunk(chunk);
      }
    } catch (error) {
      console.error('OpenClaude streaming error:', error);
      throw error;
    }
  }
}

export default new OpenClaudeService();
