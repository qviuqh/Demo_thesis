// services/api.js — HTTP service layer for Fashion Retrieval Demo

const BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

async function request(path) {
  const res = await fetch(`${BASE_URL}${path}`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || `HTTP ${res.status}`);
  }
  return res.json();
}

export const api = {
  /** Check backend liveness */
  health: () => request("/health"),

  /** Paginated product catalog */
  listProducts: (limit = 60, offset = 0) =>
    request(`/products?limit=${limit}&offset=${offset}`),

  /** Single product detail */
  getProduct: (itemId) => request(`/products/${itemId}`),

  /** Top-K recommendations for an item */
  recommend: (itemId, k = 10) =>
    request(`/recommend/${itemId}?k=${k}`),
};
