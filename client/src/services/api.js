// API Service for backend integration
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Helper for API requests
async function apiRequest(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  };

  if (config.body && typeof config.body === 'object') {
    config.body = JSON.stringify(config.body);
  }

  const response = await fetch(url, config);
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || `API Error: ${response.status}`);
  }

  return data;
}

// Demo Bookings API
export const bookingsApi = {
  // Get all bookings
  async getAll() {
    return apiRequest('/zoom/bookings');
  },

  // Create new booking
  async create(bookingData) {
    return apiRequest('/zoom/book', {
      method: 'POST',
      body: bookingData,
    });
  },

  // Approve booking
  async approve(id, adminMessage = '') {
    return apiRequest(`/zoom/approve/${id}`, {
      method: 'POST',
      body: { admin_message: adminMessage },
    });
  },

  // Reject booking
  async reject(id, adminMessage = '') {
    return apiRequest(`/zoom/reject/${id}`, {
      method: 'POST',
      body: { admin_message: adminMessage },
    });
  },

  // Delete booking
  async delete(id) {
    return apiRequest(`/zoom/booking/${id}`, {
      method: 'DELETE',
    });
  },

  // Test Zoom connection
  async testZoom() {
    return apiRequest('/zoom/test-zoom');
  },
};

// Main API Routes
export const mainApi = {
  // Health check
  async health() {
    return apiRequest('/');
  },

  // Debug booking
  async debugBooking(id) {
    return apiRequest(`/debug-booking/${id}`);
  },
};

// AI & Security Services
export const aiApi = {
  // Groq AI
  async groqHealth() {
    return apiRequest('/ai/groq/health');
  },

  async groqChat(message, options = {}) {
    return apiRequest('/ai/groq/chat', {
      method: 'POST',
      body: { message, options },
    });
  },

  async groqCRMInsights(customerData) {
    return apiRequest('/ai/groq/crm-insights', {
      method: 'POST',
      body: { customerData },
    });
  },

  async adminSystemScan() {
    return apiRequest('/ai/groq/admin/system-scan');
  },

  async adminDiagnostics(message, moduleName, snapshot = {}, options = {}) {
    return apiRequest('/ai/groq/admin/diagnostics', {
      method: 'POST',
      body: {
        message,
        module: moduleName,
        snapshot,
        options,
      },
    });
  },
};

export const securityApi = {
  // Nuclei Web Security
  async nucleiScan(target, options = {}) {
    return apiRequest('/security/nuclei/scan', {
      method: 'POST',
      body: { target, options },
    });
  },

  async nucleiHealth() {
    return apiRequest('/security/nuclei/health');
  },

  // Trivy Code Security
  async trivyImageScan(image, options = {}) {
    return apiRequest('/security/trivy/image', {
      method: 'POST',
      body: { image, options },
    });
  },

  async trivyCodeScan(path, options = {}) {
    return apiRequest('/security/trivy/code', {
      method: 'POST',
      body: { path, options },
    });
  },

  // Unified Security
  async securityReport(target) {
    return apiRequest('/security/report', {
      method: 'POST',
      body: { target },
    });
  },

  async securityDashboard(days = 30) {
    return apiRequest(`/security/dashboard?days=${days}`);
  },
};

export default {
  bookings: bookingsApi,
  main: mainApi,
  ai: aiApi,
  security: securityApi,
};
