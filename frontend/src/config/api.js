// Centralized API configuration and service helper for FinGuard AI
import axios from "axios";

export const API_BASE_URL =
  (import.meta.env && import.meta.env.VITE_API_URL) || "http://localhost:5001";

export const API_URL = `${API_BASE_URL}/api`;
export const TRANSACTIONS_API = `${API_URL}/transactions`;
export const INVESTIGATIONS_API = `${API_URL}/investigations`;

// Extract clean error message from API response
export const extractErrorMessage = (error, fallback = "An unexpected error occurred.") => {
  if (error.response?.data?.message) {
    return error.response.data.message;
  }
  if (error.response?.data?.error) {
    return error.response.data.error;
  }
  if (error.message) {
    return error.message;
  }
  return fallback;
};

// Health Check
export const checkHealth = async () => {
  try {
    const response = await axios.get(`${API_URL}/health`, { timeout: 6000 });
    return response.data;
  } catch (err) {
    return {
      status: "Offline",
      database: "Disconnected",
      error: err.message,
    };
  }
};

// Transactions API Client
export const transactionsApi = {
  getAll: async (params = {}) => {
    const response = await axios.get(TRANSACTIONS_API, { params });
    return response.data;
  },
  getById: async (id) => {
    const response = await axios.get(`${TRANSACTIONS_API}/${id}`);
    return response.data;
  },
  create: async (payload) => {
    const response = await axios.post(TRANSACTIONS_API, payload);
    return response.data;
  },
  update: async (id, payload) => {
    const response = await axios.put(`${TRANSACTIONS_API}/${id}`, payload);
    return response.data;
  },
  delete: async (id) => {
    const response = await axios.delete(`${TRANSACTIONS_API}/${id}`);
    return response.data;
  },
};

// Investigations API Client
export const investigationsApi = {
  getAll: async (params = {}) => {
    const response = await axios.get(INVESTIGATIONS_API, { params });
    return response.data;
  },
  getById: async (id) => {
    const response = await axios.get(`${INVESTIGATIONS_API}/${id}`);
    return response.data;
  },
  create: async (payload) => {
    const response = await axios.post(INVESTIGATIONS_API, payload);
    return response.data;
  },
  update: async (id, payload) => {
    const response = await axios.put(`${INVESTIGATIONS_API}/${id}`, payload);
    return response.data;
  },
};

export default {
  API_BASE_URL,
  API_URL,
  TRANSACTIONS_API,
  INVESTIGATIONS_API,
  checkHealth,
  transactionsApi,
  investigationsApi,
  extractErrorMessage,
};
