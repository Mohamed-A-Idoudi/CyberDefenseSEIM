import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for auth token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error);
    return Promise.reject(error);
  }
);

export interface LogEntry {
  id?: string;
  timestamp: string;
  ip: string;
  event: string;
  severity?: 'low' | 'medium' | 'high' | 'critical';
  source?: string;
}

export interface ApiHealth {
  status: string;
}

export interface LogsResponse {
  logs: LogEntry[];
  total?: number;
}

export interface UploadResponse {
  success: boolean;
  message: string;
  count?: number;
}

// Health check
export const checkHealth = async (): Promise<ApiHealth> => {
  const response = await api.get('/api/health');
  return response.data;
};

// Upload logs
export const uploadLogs = async (file: File): Promise<UploadResponse> => {
  const formData = new FormData();
  formData.append('file', file);
  
  const response = await api.post('/api/logs/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

// Get latest logs
export const getLatestLogs = async (): Promise<LogsResponse> => {
  const response = await api.get('/api/logs/latest');
  return response.data;
};

// Search logs with filters
export const searchLogs = async (params: {
  ip?: string;
  startDate?: string;
  endDate?: string;
  eventType?: string;
  page?: number;
  limit?: number;
}): Promise<LogsResponse> => {
  const response = await api.get('/api/logs/search', { params });
  return response.data;
};

export default api;
