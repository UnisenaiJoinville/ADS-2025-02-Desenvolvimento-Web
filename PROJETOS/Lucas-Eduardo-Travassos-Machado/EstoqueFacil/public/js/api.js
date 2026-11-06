// Unica instancia HTTP; sessao continua centralizada em auth.js.
import axios from "https://cdn.jsdelivr.net/npm/axios@1.21.0/dist/esm/axios.min.js";
import { clearSession, getToken, LOGIN_PAGE } from "./auth.js";
const http = axios.create({ baseURL: "/api", timeout: 15000 });
http.interceptors.request.use((config) => {
  if (!config.publicAuth) {
    const token = getToken();
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
http.interceptors.response.use(
  (response) => (response.status === 204 ? null : response.data),
  async (error) => {
    if (axios.isCancel(error)) throw error;
    const status = error.response?.status ?? 0;
    if (
      status === 401 &&
      !error.config?.publicAuth &&
      error.config?.headers?.Authorization
    ) {
      clearSession();
      window.location.replace(LOGIN_PAGE);
      const expired = new Error("Sessao expirada. Faca login novamente");
      expired.status = status;
      throw expired;
    }
    let data = error.response?.data;
    if (data instanceof Blob) {
      try {
        data = JSON.parse(await data.text());
      } catch {
        data = null;
      }
    }
    const message =
      data?.error ??
      (error.code === "ECONNABORTED"
        ? "O servidor demorou demais para responder. Tente de novo"
        : !error.response
          ? "Sem conexao com o servidor"
          : "Erro ao comunicar com o servidor");
    const appError = new Error(message);
    appError.status = status;
    throw appError;
  },
);
export const isCanceled = (error) => axios.isCancel(error);
const cleanParams = (filters = {}) =>
  Object.fromEntries(
    Object.entries(filters).filter(
      ([, v]) => v !== undefined && v !== null && v !== "" && v !== false,
    ),
  );
const get = (path, filters, options = {}) =>
  http.get(path, { params: cleanParams(filters), signal: options.signal });
export const api = {
  register: (payload) =>
    http.post("/auth/register", payload, { publicAuth: true }),
  login: (payload) => http.post("/auth/login", payload, { publicAuth: true }),
  me: () => get("/auth/me"),
  getDashboard: () => get("/dashboard"),
  getDailyMovements: (days = 30, options) =>
    get("/dashboard/movements-by-day", { days }, options),
  listCategories: (options) => get("/categories", {}, options),
  createCategory: (payload) => http.post("/categories", payload),
  updateCategory: (id, payload) => http.put(`/categories/${id}`, payload),
  deleteCategory: (id) => http.delete(`/categories/${id}`),
  listProducts: (filters, options) => get("/products", filters, options),
  searchProducts: (q, options = {}) =>
    get("/products/search", { q, limit: options.limit ?? 8 }, options),
  getProduct: (id) => get(`/products/${id}`),
  createProduct: (payload) => http.post("/products", payload),
  updateProduct: (id, payload) => http.put(`/products/${id}`, payload),
  deleteProduct: (id) => http.delete(`/products/${id}`),
  listMovements: (filters, options) => get("/movements", filters, options),
  createMovement: (payload) => http.post("/movements", payload),
  reportProducts: (filters) => get("/reports/products", filters),
  reportStockSummary: () => get("/reports/stock-summary"),
  reportStockByCategory: () => get("/reports/stock-by-category"),
  reportProductsWithoutMovement: () =>
    get("/reports/products-without-movement"),
  reportAbcCurve: () => get("/reports/abc-curve"),
  reportMovements: (filters) => get("/reports/movements", filters),
  reportMovementsByUser: (filters) =>
    get("/reports/movements-by-user", filters),
  reportMovementsByMonth: (filters) =>
    get("/reports/movements-by-month", filters),
  reportTopProducts: (filters) => get("/reports/top-products", filters),
};
export async function downloadReport(path, filters, fileName, options = {}) {
  const blob = await http.get(path, {
    params: cleanParams({ ...filters, format: "csv" }),
    responseType: "blob",
    signal: options.signal,
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.append(link);
  try {
    link.click();
  } finally {
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
}
