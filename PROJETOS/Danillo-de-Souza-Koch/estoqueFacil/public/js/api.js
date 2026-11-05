// Camada unica de acesso a API.
// Centralizar o fetch evita repetir tratamento de erro em cada tela.

import { clearSession, getToken, LOGIN_PAGE } from "./auth.js";

const BASE_URL = "/api";

async function request(path, options = {}) {
  const token = getToken();

  const headers = { "Content-Type": "application/json", ...options.headers };

  // Se ha sessao, todo pedido leva o cracha junto.
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${BASE_URL}${path}`, { ...options, headers });

  // 401 COM token = a sessao venceu. Limpamos e voltamos para o login.
  // 401 SEM token = e a propria tela de login dizendo "senha errada",
  // e nela nao pode haver redirecionamento nenhum.
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

function buildQuery(filters = {}) {
  const params = new URLSearchParams();

  for (const [key, value] of Object.entries(filters)) {
    if (value === undefined || value === null || value === "" || value === false) {
      continue;
    }

    params.set(key, String(value));
  }

  const query = params.toString();

  return query ? `?${query}` : "";
}

export async function downloadReport(path, filters, fileName) {
  const token = getToken();
  const params = new URLSearchParams();

  for (const [key, value] of Object.entries(filters ?? {})) {
    if (value === undefined || value === null || value === "" || value === false) {
      continue;
    }

    params.set(key, String(value));
  }

  params.set("format", "csv");

  const response = await fetch(
    `${BASE_URL}${path}?${params.toString()}`,
    {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    }
  );

  if (response.status === 401 && token) {
    clearSession();
    window.location.replace(LOGIN_PAGE);
    throw new Error("Sessao expirada. Faca login novamente");
  }

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.error ?? "Erro ao exportar relatorio");
  }

  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.append(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
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

  reportProducts: (filters = {}) => request(`/reports/products${buildQuery(filters)}`),
  reportStockSummary: () => request("/reports/stock-summary"),
  reportStockByCategory: () => request("/reports/stock-by-category"),
  reportProductsWithoutMovement: () => request("/reports/products-without-movement"),
  reportAbcCurve: () => request("/reports/abc-curve"),
  reportMovements: (filters = {}) => request(`/reports/movements${buildQuery(filters)}`),
  reportMovementsByUser: (filters = {}) =>
    request(`/reports/movements-by-user${buildQuery(filters)}`),
  reportMovementsByMonth: (filters = {}) =>
    request(`/reports/movements-by-month${buildQuery(filters)}`),
  reportTopProducts: (filters = {}) =>
    request(`/reports/top-products${buildQuery(filters)}`),
};