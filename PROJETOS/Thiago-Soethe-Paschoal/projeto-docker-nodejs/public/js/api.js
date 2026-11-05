// Camada unica de acesso a API.
// Desde a Aula 61 quem faz as requisicoes e o axios. As telas nao
// perceberam a troca: elas so conhecem o objeto "api" la embaixo.

import axios from "https://cdn.jsdelivr.net/npm/axios@1.7.9/dist/esm/axios.min.js";

import { clearSession, getToken, LOGIN_PAGE } from "./auth.js";

// Instancia configurada para a nossa API: o que e comum fica aqui.
const http = axios.create({
  baseURL: "/api",
  timeout: 15000,
});

// Interceptor de REQUISICAO: todo pedido leva o token, se houver sessao.
http.interceptors.request.use((config) => {
  const token = getToken();

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

// Interceptor de RESPOSTA: as telas so recebem o corpo (ou um Error com mensagem boa).
http.interceptors.response.use(
  // O 204 do DELETE chega com corpo vazio (""): devolvemos null.
  (response) => (response.data === "" ? null : response.data),

  (error) => {
    // Cancelada de proposito (busca que ficou velha): a tela ignora.
    if (axios.isCancel(error)) {
      return Promise.reject(error);
    }

    // 401 COM token = sessao venceu. 401 SEM token = senha errada no login.
    if (error.response?.status === 401 && error.config?.headers?.Authorization) {
      clearSession();
      window.location.replace(LOGIN_PAGE);

      return Promise.reject(toAppError(error, "Sessao expirada. Faca login novamente"));
    }

    return Promise.reject(toAppError(error));
  }
);

// Transforma o erro do axios em um Error com a mensagem do back-end e o status HTTP.
function toAppError(error, fallbackMessage) {
  let message = fallbackMessage ?? error.response?.data?.error;

  if (!message && error.code === "ECONNABORTED") {
    message = "O servidor demorou demais para responder. Tente de novo";
  }

  if (!message && !error.response) {
    message = "Sem conexao com o servidor";
  }

  const appError = new Error(message ?? "Erro ao comunicar com o servidor");
  appError.status = error.response?.status ?? 0;

  return appError;
}

export function isCanceled(error) {
  return axios.isCancel(error);
}

// Tira os filtros vazios, para nao mandar "?search=&categoryId=".
function cleanParams(filters = {}) {
  return Object.fromEntries(
    Object.entries(filters).filter(
      ([, value]) => value !== undefined && value !== null && value !== "" && value !== false
    )
  );
}

export const api = {
  register: (payload) => http.post("/auth/register", payload),
  login: (payload) => http.post("/auth/login", payload),
  me: () => http.get("/auth/me"),

  getDashboard: () => http.get("/dashboard"),
  getDailyMovements: (days = 30) =>
    http.get("/dashboard/movements-by-day", { params: { days } }),

  listCategories: () => http.get("/categories"),
  createCategory: (payload) => http.post("/categories", payload),
  updateCategory: (id, payload) => http.put(`/categories/${id}`, payload),
  deleteCategory: (id) => http.delete(`/categories/${id}`),

  // options.signal permite cancelar a busca.
  listProducts: (filters = {}, options = {}) =>
    http.get("/products", { params: cleanParams(filters), signal: options.signal }),
  // Busca rapida para o autocomplete (Aula 62). O q vazio e valido: "me mostre os primeiros".
  searchProducts: (term, options = {}) =>
    http.get("/products/search", {
      params: { q: term, limit: options.limit ?? 8 },
      signal: options.signal,
    }),
  getProduct: (id) => http.get(`/products/${id}`),
  createProduct: (payload) => http.post("/products", payload),
  updateProduct: (id, payload) => http.put(`/products/${id}`, payload),
  deleteProduct: (id) => http.delete(`/products/${id}`),

  listMovements: (filters = {}) => http.get("/movements", { params: cleanParams(filters) }),
  createMovement: (payload) => http.post("/movements", payload),

  reportProducts: (filters) => http.get("/reports/products", { params: cleanParams(filters) }),
  reportStockSummary: () => http.get("/reports/stock-summary"),
  reportStockByCategory: () => http.get("/reports/stock-by-category"),
  reportProductsWithoutMovement: () => http.get("/reports/products-without-movement"),
  reportAbcCurve: () => http.get("/reports/abc-curve"),
  reportMovements: (filters) => http.get("/reports/movements", { params: cleanParams(filters) }),
  reportMovementsByUser: (filters) =>
    http.get("/reports/movements-by-user", { params: cleanParams(filters) }),
  reportMovementsByMonth: (filters) =>
    http.get("/reports/movements-by-month", { params: cleanParams(filters) }),
  reportTopProducts: (filters) =>
    http.get("/reports/top-products", { params: cleanParams(filters) }),
};

// Download de CSV: com responseType "blob" a resposta vira arquivo.
export async function downloadReport(path, filters, fileName) {
  let blob;

  try {
    blob = await http.get(path, {
      params: cleanParams({ ...filters, format: "csv" }),
      responseType: "blob",
    });
  } catch (error) {
    if (error.status === 401) throw error;

    throw new Error("Nao foi possivel gerar o arquivo");
  }

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
