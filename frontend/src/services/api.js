import axios from 'axios';

// Dynamic configuration
const getApiBaseUrl = () => {
  return process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000/api';
};

const getTimeout = () => {
  return parseInt(process.env.REACT_APP_API_TIMEOUT) || 10000;
};

class ApiService {
  constructor() {
    this.apiKey = '';
    this.baseURL = getApiBaseUrl();
    this.timeout = getTimeout();
  }

  setApiKey(key) {
    this.apiKey = key;
    console.log('API Key set:', key ? `${key.substring(0, 20)}...` : 'empty');
  }

  getHeaders() {
    return {
      'X-API-Key': this.apiKey,
      'Content-Type': 'application/json'
    };
  }

  async makeRequest(method, endpoint, data = null, params = {}) {
    const config = {
      method,
      url: `${this.baseURL}${endpoint}`,
      headers: this.getHeaders(),
      timeout: this.timeout,
      params
    };

    if (data) {
      config.data = data;
    }

    console.log(`Making ${method.toUpperCase()} request to:`, config.url);
    return await axios(config);
  }

  async getActors(options = {}) {
    const params = {
      limit: options.limit || 1000,
      offset: options.offset || 0,
      desc: options.desc || false
    };

    const response = await this.makeRequest('GET', '/actors', null, params);
    return response.data;
  }

  async getActorSchema(actorId) {
    const response = await this.makeRequest('GET', `/actors/${actorId}/schema`);
    return response.data;
  }

  async runActor(actorId, input, options = {}) {
    const data = { 
      input, 
      options: {
        timeout: options.timeout,
        memory: options.memory,
        ...options
      }
    };
    
    const params = {
      format: options.format || 'json',
      limit: options.limit
    };

    const response = await this.makeRequest('POST', `/actors/${actorId}/run`, data, params);
    return response.data;
  }

  // Dynamic health check
  async checkHealth() {
    const response = await axios.get(`${this.baseURL.replace('/api', '')}/health`, {
      timeout: this.timeout
    });
    return response.data;
  }
}

export default new ApiService();
