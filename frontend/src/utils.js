// Utility function for className merging
export function cn(...inputs) {
  return inputs.filter(Boolean).join(" ");
}

// API Base URL - automatically detects environment
// API Base URL - Environment aware
export const API_BASE = (() => {
  // 1. Check for explicit environment variable
  const envUrl = process.env.REACT_APP_API_URL || process.env.API_URL || process.env.VITE_API_URL;

  if (envUrl) {
    let url = envUrl;
    if (!url.startsWith('http://') && !url.startsWith('https://') && !url.startsWith('/')) {
      url = `https://${url}`;
    }
    return url.endsWith('/') ? url.slice(0, -1) : url;
  }

  // 2. Check if we're on a local IP (e.g. 192.168.x.x)
  // This helps with mobile testing over local network
  const isIP = /^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/.test(window.location.hostname);
  if (isIP) {
    // If accessing via IP, point to port 8000 for backend
    return `http://${window.location.hostname}:8000`;
  }

  // 3. Check if we're on Vercel
  if (window.location.hostname.includes('vercel.app')) {
    return window.location.origin;
  }

  // 4. Default to localhost for development
  return "http://localhost:8000";
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

// SEO Meta Tags Utility
export const updateMetaTags = (options = {}) => {
  const {
    title = "SmartResume - Build Job-Ready Resumes with Precision ATS Scoring",
    description = "Trusted by students for placements & internships. Get advanced resume review aligned with technical & recruiter logic.",
    image = "https://smartresume.app/og-image.png",
    url = window.location.href,
    type = "website"
  } = options;

  // Update document title
  document.title = title;

  // Helper to set or create meta tag
  const setMetaTag = (attribute, value, property = false) => {
    const selector = property ? `meta[property="${attribute}"]` : `meta[name="${attribute}"]`;
    let meta = document.querySelector(selector);

    if (!meta) {
      meta = document.createElement("meta");
      if (property) {
        meta.setAttribute("property", attribute);
      } else {
        meta.setAttribute("name", attribute);
      }
      document.head.appendChild(meta);
    }
    meta.setAttribute("content", value);
  };

  // Update basic meta tags
  setMetaTag("title", title);
  setMetaTag("description", description);

  // Update Open Graph tags
  setMetaTag("og:title", title, true);
  setMetaTag("og:description", description, true);
  setMetaTag("og:image", image, true);
  setMetaTag("og:url", url, true);
  setMetaTag("og:type", type, true);

  // Update Twitter Card tags
  setMetaTag("twitter:title", title);
  setMetaTag("twitter:description", description);
  setMetaTag("twitter:image", image);
  setMetaTag("twitter:url", url);

  // Update canonical URL
  let canonical = document.querySelector("link[rel='canonical']");
  if (!canonical) {
    canonical = document.createElement("link");
    canonical.setAttribute("rel", "canonical");
    document.head.appendChild(canonical);
  }
  canonical.setAttribute("href", url);
};