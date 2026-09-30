// Camada unica de acesso a API.
// Centralizar o fetch evita repetir tratamento de erro em cada tela.

import {
  clearSession,
  getRefreshToken,
  getToken,
  LOGIN_PAGE,
  saveTokens,
} from "./auth.js";

const BASE_URL = "/api";

// Renovacao do token de acesso (exercicio 3.2).
// Guardamos a promessa em andamento: se 5 pedidos tomarem 401 ao mesmo
// tempo, so UMA renovacao e feita e todos esperam por ela. Isso importa
// porque cada refresh token so pode ser usado uma vez (rotacao).
let refreshing = null;

function refreshAccessToken() {
  if (!refreshing) {
    refreshing = (async () => {
      const refreshToken = getRefreshToken();

      if (!refreshToken) return false;

      try {
        const response = await fetch(`${BASE_URL}/auth/refresh`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ refreshToken }),
        });

        if (!response.ok) return false;

        saveTokens(await response.json());

        return true;
      } catch {
        return false;
      }
    })().finally(() => {
      refreshing = null;
    });
  }

  return refreshing;
}

function endSession() {
  clearSession();
  window.location.replace(LOGIN_PAGE);

  throw new Error("Sessao expirada. Faca login novamente");
}

async function request(path, options = {}, alreadyRetried = false) {
  const token = getToken();

  const headers = { "Content-Type": "application/json", ...options.headers };

  // Se ha sessao, todo pedido leva o cracha junto.
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${BASE_URL}${path}`, { ...options, headers });

  // 401 COM token = o token de acesso venceu. Tentamos renovar UMA vez
  // e repetimos o pedido; se nao der, a sessao acabou de vez.
  // 401 SEM token = e a propria tela de login dizendo "senha errada",
  // e nela nao pode haver redirecionamento nenhum.
  if (response.status === 401 && token) {
    if (!alreadyRetried && (await refreshAccessToken())) {
      return request(path, options, true);
    }

    endSession();
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
  updateProfile: (payload) =>
    request("/auth/me", { method: "PUT", body: JSON.stringify(payload) }),
  changePassword: (payload) =>
    request("/auth/password", { method: "PUT", body: JSON.stringify(payload) }),
  forgotPassword: (payload) =>
    request("/auth/forgot-password", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  resetPassword: (payload) =>
    request("/auth/reset-password", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  getDashboard: () => request("/dashboard"),

  listCategories: () => request("/categories"),
  createCategory: (payload) =>
    request("/categories", { method: "POST", body: JSON.stringify(payload) }),
  updateCategory: (id, payload) =>
    request(`/categories/${id}`, { method: "PUT", body: JSON.stringify(payload) }),
  deleteCategory: (id) => request(`/categories/${id}`, { method: "DELETE" }),

  listProducts: (filters = {}) => {
    const params = new URLSearchParams();

    if (filters.search) params.set("search", filters.search);
    if (filters.categoryId) params.set("categoryId", filters.categoryId);
    if (filters.lowStock) params.set("lowStock", "true");

    const query = params.toString();

    return request(query ? `/products?${query}` : "/products");
  },
  getProduct: (id) => request(`/products/${id}`),
  createProduct: (payload) =>
    request("/products", { method: "POST", body: JSON.stringify(payload) }),
  updateProduct: (id, payload) =>
    request(`/products/${id}`, { method: "PUT", body: JSON.stringify(payload) }),
  deleteProduct: (id) => request(`/products/${id}`, { method: "DELETE" }),

  listMovements: (filters = {}) => {
    const params = new URLSearchParams();

    if (filters.productId) params.set("productId", filters.productId);
    if (filters.type) params.set("type", filters.type);

    const query = params.toString();

    return request(query ? `/movements?${query}` : "/movements");
  },
  createMovement: (payload) =>
    request("/movements", { method: "POST", body: JSON.stringify(payload) }),
};