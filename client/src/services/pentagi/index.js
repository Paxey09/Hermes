/**
 * PentAgi Service - Security & Compliance Layer
 * Provides security audits, compliance checks, and monitoring
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

class PentAgiService {
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
      console.error('PentAgi service error:', error);
      throw error;
    }
  }

  /**
   * Run security audit on a module
   */
  async runSecurityAudit(module) {
    return this.request('/services/pentagi', {
      method: 'POST',
      body: JSON.stringify({
        action: 'audit',
        module
      }),
    });
  }

  /**
   * Check compliance with standards
   */
  async checkCompliance(standards = ['PH-DPA', 'GDPR', 'ISO-27001']) {
    return this.request('/services/pentagi', {
      method: 'POST',
      body: JSON.stringify({
        action: 'compliance',
        standards
      }),
    });
  }

  /**
   * Get security report
   */
  async getSecurityReport(reportId) {
    return this.request('/services/pentagi', {
      method: 'POST',
      body: JSON.stringify({
        action: 'report',
        reportId
      }),
    });
  }

  /**
   * List all security reports
   */
  async listSecurityReports() {
    return this.request('/services/pentagi', {
      method: 'POST',
      body: JSON.stringify({
        action: 'reports'
      }),
    });
  }

  /**
   * Get vulnerability scan results
   */
  async getVulnerabilityScanResults() {
    return this.request('/services/pentagi', {
      method: 'POST',
      body: JSON.stringify({
        action: 'vulnerabilities'
      }),
    });
  }

  /**
   * Run vulnerability scan
   */
  async runVulnerabilityScan(target) {
    return this.request('/services/pentagi', {
      method: 'POST',
      body: JSON.stringify({
        action: 'vulnerability_scan',
        target
      }),
    });
  }

  /**
   * Get security metrics
   */
  async getSecurityMetrics(timeRange = '30d') {
    return this.request('/services/pentagi', {
      method: 'POST',
      body: JSON.stringify({
        action: 'metrics',
        range: timeRange
      }),
    });
  }

  /**
   * Get compliance status
   */
  async getComplianceStatus() {
    return this.request('/services/pentagi', {
      method: 'POST',
      body: JSON.stringify({
        action: 'status'
      }),
    });
  }

  /**
   * Get audit logs
   */
  async getAuditLogs(filters = {}) {
    return this.request('/services/pentagi', {
      method: 'POST',
      body: JSON.stringify({
        action: 'audit_logs',
        ...filters
      }),
    });
  }

  /**
   * Report security incident
   */
  async reportSecurityIncident(incident) {
    return this.request('/services/pentagi', {
      method: 'POST',
      body: JSON.stringify({
        action: 'incident',
        ...incident
      }),
    });
  }

  /**
   * Get security recommendations
   */
  async getSecurityRecommendations() {
    return this.request('/services/pentagi', {
      method: 'POST',
      body: JSON.stringify({
        action: 'recommendations'
      }),
    });
  }

  /**
   * Get system health check
   */
  async healthCheck() {
    try {
      return await this.request('/services/pentagi', {
        method: 'POST',
        body: JSON.stringify({
          action: 'health'
        }),
      });
    } catch (error) {
      return { status: 'unhealthy', error: error.message };
    }
  }
}

export default new PentAgiService();
