// Camada unica de acesso a API.
// Centralizar o fetch evita repetir tratamento de erro em cada tela.

import { clearSession, getToken, LOGIN_PAGE } from "./auth.js";

const BASE_URL = "/api";

async function request(path, options = {}) {
  const token = getToken();
  const headers = { "Content-Type": "application/json", ...options.headers };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${BASE_URL}${path}`, { ...options, headers });

  if (response.status === 401 && token) {
    clearSession();
    window.location.replace(LOGIN_PAGE);
    throw new Error("Sessao expirada. Faca login novamente");
  }

  if (response.status === 204) {
    return null;
  }

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.error ?? "Erro ao comunicar com o servidor");
  }

  return data;
}

export const api = {
  register: (payload) =>
    request("/auth/register", { method: "POST", body: JSON.stringify(payload) }),
  login: (payload) =>
    request("/auth/login", { method: "POST", body: JSON.stringify(payload) }),
  me: () => request("/auth/me"),

  getDashboard: () => request("/dashboard"),

  listCategories: () => request("/categories"),

  createCategory: (payload) =>
    request("/categories", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  updateCategory: (id, payload) =>
    request(`/categories/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    }),

  deleteCategory: (id) =>
    request(`/categories/${id}`, {
      method: "DELETE",
    }),

  listProducts: (filters = {}) => {
    const params = new URLSearchParams();

    if (filters.search) {
      params.set("search", filters.search);
    }

    if (filters.categoryId) {
      params.set("categoryId", filters.categoryId);
    }

    if (filters.lowStock) {
      params.set("lowStock", "true");
    }

    // Ordenacao dos produtos
    if (filters.orderBy) {
      params.set("orderBy", filters.orderBy);
    }

    const query = params.toString();

    return request(
      query ? `/products?${query}` : "/products"
    );
  },

  getProduct: (id) =>
    request(`/products/${id}`),

  createProduct: (payload) =>
    request("/products", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  updateProduct: (id, payload) =>
    request(`/products/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    }),

  deleteProduct: (id) =>
    request(`/products/${id}`, {
      method: "DELETE",
    }),

  listMovements: (filters = {}) => {
    const params = new URLSearchParams();

    if (filters.productId) {
      params.set("productId", filters.productId);
    }

    if (filters.type) {
      params.set("type", filters.type);
    }

    const query = params.toString();

    return request(
      query ? `/movements?${query}` : "/movements"
    );
  },

  createMovement: (payload) =>
    request("/movements", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
};
