/**
 * Python API client for Express backend
 */
import axios from 'axios';

const pythonAPI = axios.create({
  baseURL: process.env.PYTHON_API_URL || 'http://localhost:8000',
  timeout: 60000, // 60s timeout for slow scraping operations
  headers: {
    'X-API-Key': process.env.PYTHON_API_KEY || '',
    'Content-Type': 'application/json',
  },
});

// Response interceptor for logging
pythonAPI.interceptors.response.use(
  (response) => {
    console.log(`✅ Python API Success: ${response.config?.method?.toUpperCase()} ${response.config?.url} - ${response.status} (${response.data?.response_time_ms || 0}ms)`);
    return response;
  },
  (error) => {
    const errorDetails = {
      url: error.config?.url,
      params: error.config?.params,
      status: error.response?.status,
      message: error.message,
      data: error.response?.data,
      isTimeout: error.code === 'ECONNABORTED',
    };
    console.error('❌ Python API Error:', JSON.stringify(errorDetails, null, 2));
    throw error;
  }
);

// Scam Search APIs
export async function searchScams(keyword: string, type?: string) {
  const response = await pythonAPI.get('/api/v1/scams/search', {
    params: { keyword, type },
  });
  return response.data;
}

export async function searchAdminVn(keyword: string) {
  const response = await pythonAPI.get('/api/v1/scams/admin', {
    params: { keyword },
  });
  return response.data;
}

export async function searchCheckscamVn(keyword: string) {
  const response = await pythonAPI.get('/api/v1/scams/checkscam', {
    params: { keyword },
  });
  return response.data;
}

export async function searchChongluadaoVn(keyword: string) {
  const response = await pythonAPI.get('/api/v1/scams/chongluadao', {
    params: { keyword },
  });
  return response.data;
}

// AI APIs
export async function chatWithAI(message: string, sessionId?: string, context?: any[]) {
  const response = await pythonAPI.post('/api/v1/ai/chat', {
    message,
    session_id: sessionId,
    context,
  });
  return response.data;
}

export async function analyzeText(text: string) {
  const response = await pythonAPI.post('/api/v1/ai/analyze', {
    text,
  });
  return response.data;
}

// Cache APIs
export async function getCacheStats() {
  const response = await pythonAPI.get('/api/v1/cache/stats');
  return response.data;
}

export async function clearCache(pattern: string = 'scam:search:*') {
  const response = await pythonAPI.delete('/api/v1/cache/clear', {
    params: { pattern },
  });
  return response.data;
}

// Health Check
export async function checkPythonHealth() {
  const response = await pythonAPI.get('/health');
  return response.data;
}

export default pythonAPI;
