/**
 * Guardian Platform - Centralized API Configuration
 *
 * In development, defaults to local Node backend (http://localhost:3000).
 * In production (e.g. Vercel deployment), reads NEXT_PUBLIC_API_URL
 * pointing to your deployed backend (e.g. https://guardian-backend.onrender.com).
 */

export const getApiBaseUrl = (): string => {
  // If explicitly configured in environment variables (Vercel, etc.)
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL.replace(/\/$/, "");
  }

  // If running in browser on localhost, default to port 3000
  if (typeof window !== "undefined") {
    if (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1") {
      return "http://localhost:3000";
    }
  }

  // Default fallback for local development
  return "http://localhost:3000";
};

export const API_URL = getApiBaseUrl();
