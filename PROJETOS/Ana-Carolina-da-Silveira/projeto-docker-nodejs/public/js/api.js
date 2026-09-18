const API_BASE_URL = "/api"; // Ajuste para "" (vazio) caso suas rotas no backend não usem o prefixo /api

async function request(endpoint, options = {}) {
  const token = localStorage.getItem("@estoque:token");

  const headers = {
    "Content-Type": "application/json",
    ...options.headers,
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(data?.message || "Ocorreu um erro ao processar a requisição.");
  }

  return data;
}

export const api = {
  // Autenticação
  login: (credentials) =>
    request("/auth/login", {
      method: "POST",
      body: JSON.stringify(credentials),
    }),

  // Dashboard
  getDashboard: () => request("/dashboard"),

  // Categorias
  listCategories: () => request("/categories"),
  createCategory: (data) =>
    request("/categories", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  // Produtos
  listProducts: (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.search) params.set("search", filters.search);
    if (filters.categoryId) params.set("categoryId", filters.categoryId);
    if (filters.page) params.set("page", filters.page);
    if (filters.perPage) params.set("perPage", filters.perPage);

    const query = params.toString();
    return request(query ? `/products?${query}` : "/products");
  },

  createProduct: (data) =>
    request("/products", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  updateProduct: (id, data) =>
    request(`/products/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  deleteProduct: (id) =>
    request(`/products/${id}`, {
      method: "DELETE",
    }),

  // Movimentações
  listMovements: (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.productId) params.set("productId", filters.productId);
    if (filters.type) params.set("type", filters.type);
    if (filters.from) params.set("from", filters.from);
    if (filters.to) params.set("to", filters.to);

    const query = params.toString();
    return request(query ? `/movements?${query}` : "/movements");
  },

  createMovement: (data) =>
    request("/movements", {
      method: "POST",
      body: JSON.stringify(data),
    }),
};