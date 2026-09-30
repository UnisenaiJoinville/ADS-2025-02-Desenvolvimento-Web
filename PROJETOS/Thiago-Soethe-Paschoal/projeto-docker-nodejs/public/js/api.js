// Camada unica de acesso a API.
// Centralizar o fetch evita repetir tratamento de erro em cada tela.

const BASE_URL = "/api";

async function request(path, options = {}) {
  const response = await fetch(`${BASE_URL}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });

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