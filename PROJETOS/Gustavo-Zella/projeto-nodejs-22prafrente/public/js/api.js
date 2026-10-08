// Camada unica de acesso a API.
// Centralizar o fetch evita repetir tratamento de erro em cada tela.

const BASE_URL = "/api";
const TOKEN_KEY = "estoque-facil:token";
const USER_KEY = "estoque-facil:user";

// --- Sessao (Exercicio 3.1 — autenticacao) -----------------------------

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function getCurrentUser() {
  const raw = localStorage.getItem(USER_KEY);
  return raw ? JSON.parse(raw) : null;
}

export function setSession(token, user) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearSession() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

export function isAuthenticated() {
  return Boolean(getToken());
}

// Redireciona para o login se a rota atual exigir sessao.
export function requireSession() {
  if (!isAuthenticated()) {
    window.location.href = "/login.html";
  }
}

// --- Requisicoes ---------------------------------------------------------

async function request(path, options = {}) {
  const token = getToken();

  const headers = { "Content-Type": "application/json", ...options.headers };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${BASE_URL}${path}`, { ...options, headers });

  if (response.status === 204) {
    return null;
  }

  // Token invalido/expirado: manda para o login.
  if (response.status === 401 && token) {
    clearSession();
    window.location.href = "/login.html";
    return null;
  }

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.error ?? "Erro ao comunicar com o servidor");
  }

  return data;
}

export const api = {
  login: (payload) => request("/auth/login", { method: "POST", body: JSON.stringify(payload) }),
  register: (payload) =>
    request("/auth/register", { method: "POST", body: JSON.stringify(payload) }),

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
    if (filters.includeInactive) params.set("includeInactive", "true");
    if (filters.orderBy) params.set("orderBy", filters.orderBy);
    if (filters.orderDir) params.set("orderDir", filters.orderDir);
    if (filters.page) params.set("page", filters.page);
    if (filters.perPage) params.set("perPage", filters.perPage);

    const query = params.toString();

    return request(query ? `/products?${query}` : "/products");
  },
  getProduct: (id) => request(`/products/${id}`),
  createProduct: (payload) =>
    request("/products", { method: "POST", body: JSON.stringify(payload) }),
  updateProduct: (id, payload) =>
    request(`/products/${id}`, { method: "PUT", body: JSON.stringify(payload) }),
  deleteProduct: (id) => request(`/products/${id}`, { method: "DELETE" }),
  reactivateProduct: (id) => request(`/products/${id}/reactivate`, { method: "PATCH" }),
  exportProductsCsvUrl: () => `${BASE_URL}/products/export`,

  listMovements: (filters = {}) => {
    const params = new URLSearchParams();

    if (filters.productId) params.set("productId", filters.productId);
    if (filters.type) params.set("type", filters.type);
    if (filters.from) params.set("from", filters.from);
    if (filters.to) params.set("to", filters.to);

    const query = params.toString();

    return request(query ? `/movements?${query}` : "/movements");
  },
  createMovement: (payload) =>
    request("/movements", { method: "POST", body: JSON.stringify(payload) }),
};
