import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
export const API = `${BACKEND_URL}/api`;

const api = axios.create({ baseURL: API });

api.interceptors.request.use((config) => {
  const t = localStorage.getItem("iclone_token");
  if (t) config.headers.Authorization = `Bearer ${t}`;
  return config;
});

api.interceptors.response.use(
  (r) => r,
  (err) => {
    if (err?.response?.status === 401) {
      localStorage.removeItem("iclone_token");
      if (!window.location.pathname.startsWith("/auth")) {
        window.location.href = "/auth/login";
      }
    }
    if (err?.response?.status === 402) {
      // Expose a flag the UI can listen to
      window.dispatchEvent(new CustomEvent("iclone:paywall", { detail: err.response.data?.detail }));
    }
    return Promise.reject(err);
  }
);

export default api;
