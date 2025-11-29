// Utility function for className merging
export function cn(...inputs) {
  return inputs.filter(Boolean).join(" ");
}

// API Base URL - automatically detects environment
export const API_BASE = (() => {
  // Check if we're in production (served from same origin)
  if (window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
    return window.location.origin;
  }
  // Development mode - use env variable or default to port 8000
  return process.env.BACKEND_URL || "http://localhost:8000";
})();

// Token management functions
export const getAuthToken = () => {
  try {
    return localStorage.getItem("token");
  } catch (error) {
    console.error("Failed to get auth token:", error);
    return null;
  }
};

export const setAuthToken = (token) => {
  try {
    if (token) {
      localStorage.setItem("token", token);
    }
  } catch (error) {
    console.error("Failed to set auth token:", error);
  }
};

export const removeAuthToken = () => {
  try {
    localStorage.removeItem("token");
  } catch (error) {
    console.error("Failed to remove auth token:", error);
  }
};

export const isAuthenticated = () => {
  const token = getAuthToken();
  return !!token;
};

// Error handler for API calls
export const handleApiError = (error) => {
  if (!error.response) {
    return "Network error. Please check your connection and try again.";
  }
  
  const { status, data } = error.response;
  
  // Handle specific HTTP status codes
  if (status === 401) {
    removeAuthToken();
    return "Session expired. Please login again.";
  }
  
  if (status === 400) {
    return data?.detail || "Invalid request. Please check your input.";
  }
  
  if (status === 404) {
    return "Service not found. Please try again later.";
  }
  
  if (status === 500) {
    return "Server error. Please try again later.";
  }
  
  // Return API error message or generic message
  return data?.detail || `Error: ${status}. Please try again.`;
};