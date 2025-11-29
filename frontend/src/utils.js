export function cn(...inputs) {
  return inputs.filter(Boolean).join(" ");
}

export const API_BASE = process.env.BACKEND_URL || "http://localhost:8000";

export const getAuthToken = () => localStorage.getItem("token");

export const setAuthToken = (token) => localStorage.setItem("token", token);

export const removeAuthToken = () => localStorage.removeItem("token");

export const isAuthenticated = () => !!getAuthToken();