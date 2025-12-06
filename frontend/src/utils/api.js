import axios from "axios";

const API_URL = "https://assign-hkfz.vercel.app/api";

const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Add token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Auth APIs
export const authAPI = {
  register: (data) => api.post("/auth/register", data),
  login: (data) => api.post("/auth/login", data),
};

// Transaction APIs
export const transactionAPI = {
  getAll: (params) => api.get("/transactions", { params }),
  getStats: (params) => api.get("/transactions/stats", { params }),
  addManual: (data) => api.post("/transactions/manual", data),
  uploadCSV: (formData) =>
    api.post("/transactions/upload", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
  delete: (id) => api.delete(`/transactions/${id}`),
};

// Budget APIs
export const budgetAPI = {
  get: (month) => api.get(`/budget/${month}`),
  set: (data) => api.post("/budget", data),
};

// Analysis APIs
export const analysisAPI = {
  generate: (data = {}) => api.post("/analysis/generate", data),
  get: (month) => api.get(month ? `/analysis/${month}` : "/analysis"),
  getAll: () => api.get("/analysis"),
};

export default api;
