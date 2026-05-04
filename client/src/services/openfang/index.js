/**
 * Openfang Service - Infrastructure Layer
 * Manages model deployment, scaling, and infrastructure resources
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

class OpenfangService {
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
      console.error('Openfang service error:', error);
      throw error;
    }
  }

  /**
   * Deploy a model to the infrastructure
   */
  async deployModel(modelConfig) {
    return this.request('/services/openfang', {
      method: 'POST',
      body: JSON.stringify({
        action: 'deploy',
        ...modelConfig
      }),
    });
  }

  /**
   * Scale infrastructure resources
   */
  async scaleResources(resourceConfig) {
    return this.request('/services/openfang', {
      method: 'POST',
      body: JSON.stringify({
        action: 'scale',
        ...resourceConfig
      }),
    });
  }

  /**
   * Get infrastructure status
   */
  async getInfrastructureStatus() {
    return this.request('/services/openfang', {
      method: 'POST',
      body: JSON.stringify({ action: 'status' }),
    });
  }

  /**
   * Get model deployment status
   */
  async getModelStatus(modelId) {
    return this.request(`/services/openfang`, {
      method: 'POST',
      body: JSON.stringify({ action: 'model_status', modelId }),
    });
  }

  /**
   * List all deployed models
   */
  async listModels() {
    return this.request('/services/openfang', {
      method: 'POST',
      body: JSON.stringify({ action: 'models' }),
    });
  }

  /**
   * Update model configuration
   */
  async updateModelConfig(modelId, config) {
    return this.request('/services/openfang', {
      method: 'POST',
      body: JSON.stringify({
        action: 'update_config',
        modelId,
        config
      }),
    });
  }

  /**
   * Delete a deployed model
   */
  async deleteModel(modelId) {
    return this.request('/services/openfang', {
      method: 'POST',
      body: JSON.stringify({
        action: 'delete_model',
        modelId
      }),
    });
  }

  /**
   * Get resource usage metrics
   */
  async getResourceMetrics(timeRange = '24h') {
    return this.request('/services/openfang', {
      method: 'POST',
      body: JSON.stringify({
        action: 'metrics',
        range: timeRange
      }),
    });
  }

  /**
   * Get system health check
   */
  async healthCheck() {
    try {
      return await this.request('/services/openfang', {
        method: 'POST',
        body: JSON.stringify({ action: 'health' }),
      });
    } catch (error) {
      return { status: 'unhealthy', error: error.message };
    }
  }
}

export default new OpenfangService();
