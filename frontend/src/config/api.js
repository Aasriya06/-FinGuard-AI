// Centralized API configuration for FinGuard AI
import axios from "axios";

export const API_BASE_URL =
  (import.meta.env && import.meta.env.VITE_API_URL) || "http://localhost:5001";

export const API_URL = `${API_BASE_URL}/api`;
export const TRANSACTIONS_API = `${API_URL}/transactions`;
export const INVESTIGATIONS_API = `${API_URL}/investigations`;

export const checkHealth = async () => {
  try {
    const response = await axios.get(`${API_URL}/health`, { timeout: 5000 });
    return response.data;
  } catch (err) {
    return {
      status: "Offline",
      database: "Disconnected",
      error: err.message,
    };
  }
};

export default {
  API_BASE_URL,
  API_URL,
  TRANSACTIONS_API,
  INVESTIGATIONS_API,
  checkHealth,
};
