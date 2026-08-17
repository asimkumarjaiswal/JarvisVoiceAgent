/**
 * api.js — Low-level HTTP utility.
 * Reads VITE_API_BASE_URL from environment; never hardcodes localhost.
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

if (!API_BASE_URL) {
  console.warn(
    '[API] VITE_API_BASE_URL is not set. ' +
    'Copy .env.example to .env and set the correct backend URL.'
  );
}

/**
 * Generic fetch wrapper.
 * @param {string} path - API path (e.g. '/api/conversations')
 * @param {RequestInit} options - Standard fetch options
 * @returns {Promise<Response>}
 */
export async function apiFetch(path, options = {}) {
  const primaryUrl = API_BASE_URL ? `${API_BASE_URL}${path}` : path;
  const defaultHeaders = { 'Content-Type': 'application/json' };
  const mergedOptions = {
    ...options,
    headers: {
      ...defaultHeaders,
      ...(options.headers || {}),
    },
  };

  try {
    const response = await fetch(primaryUrl, mergedOptions);
    if (!response.ok) {
      const errorBody = await response.text().catch(() => '');
      console.error(`[API] ${options.method || 'GET'} ${primaryUrl} → ${response.status}`, errorBody);
      throw new ApiError(response.status, response.statusText, errorBody);
    }
    return response;
  } catch (err) {
    // If cross-origin fetch to API_BASE_URL failed (e.g. CORS preflight / network error),
    // fall back to relative path proxied by Vite dev server
    if (API_BASE_URL && primaryUrl !== path) {
      console.warn(`[API] Primary fetch to ${primaryUrl} failed (${err.message}). Retrying via local proxy path ${path}...`);
      const fallbackResponse = await fetch(path, mergedOptions);
      if (!fallbackResponse.ok) {
        const errorBody = await fallbackResponse.text().catch(() => '');
        console.error(`[API Proxy] ${options.method || 'GET'} ${path} → ${fallbackResponse.status}`, errorBody);
        throw new ApiError(fallbackResponse.status, fallbackResponse.statusText, errorBody);
      }
      return fallbackResponse;
    }
    throw err;
  }
}

/**
 * Typed error class for API failures.
 */
export class ApiError extends Error {
  constructor(status, statusText, body) {
    super(`API Error ${status}: ${statusText}`);
    this.name = 'ApiError';
    this.status = status;
    this.statusText = statusText;
    this.body = body;
  }
}

export { API_BASE_URL };
