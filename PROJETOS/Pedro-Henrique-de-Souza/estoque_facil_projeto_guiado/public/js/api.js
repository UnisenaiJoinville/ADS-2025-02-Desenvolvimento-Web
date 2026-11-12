// Camada unica de acesso a API.
// Desde a Aula 61 quem faz as requisicoes e o axios. As telas nao
// perceberam a troca: elas so conhecem o objeto "api" la embaixo.

import axios from "https://cdn.jsdelivr.net/npm/axios@1.7.9/dist/esm/axios.min.js";

import { clearSession, getToken, LOGIN_PAGE } from "./auth.js";

// Uma "instancia" do axios ja configurada para a nossa API.
// Tudo que for comum a todas as requisicoes fica aqui, uma vez so.
const http = axios.create({
  baseURL: "/api",
  // Sem resposta em 15 segundos, desiste e avisa o usuario.
  timeout: 15000,
});

// ------------------------------------------------------------
// Interceptor de REQUISICAO: roda antes de TODO pedido sair.
// ------------------------------------------------------------
http.interceptors.request.use((config) => {
  const token = getToken();

  // Se ha sessao, todo pedido leva o cracha junto.
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

// ------------------------------------------------------------
// Interceptor de RESPOSTA: roda quando TODA resposta chega.
// ------------------------------------------------------------
http.interceptors.response.use(
  // Deu certo (2xx): as telas so querem o corpo da resposta.
  // O 204 do DELETE chega com corpo vazio (""): devolvemos null.
  (response) => (response.data === "" ? null : response.data),

  (error) => {
    // Requisicao cancelada DE PROPOSITO (uma busca que ficou velha).
    // Nao e um erro de verdade: devolvemos como veio, e a tela ignora.
    if (axios.isCancel(error)) {
      return Promise.reject(error);
    }

    // 401 COM token = a sessao venceu. Limpamos e voltamos para o login.
    // 401 SEM token = e a propria tela de login dizendo "senha errada",
    // e nela nao pode haver redirecionamento nenhum.
    if (error.response?.status === 401 && error.config?.headers?.Authorization) {
      clearSession();
      window.location.replace(LOGIN_PAGE);

      return Promise.reject(toAppError(error, "Sessao expirada. Faca login novamente"));
    }

    return Promise.reject(toAppError(error));
  }
);

// Transforma o erro do axios em um Error simples, com a mensagem que
// o NOSSO back-end mandou ({ "error": "..." }) e o status HTTP.
function toAppError(error, fallbackMessage) {
  let message = fallbackMessage ?? error.response?.data?.error;

  if (!message && error.code === "ECONNABORTED") {
    message = "O servidor demorou demais para responder. Tente de novo";
  }

  if (!message && !error.response) {
    message = "Sem conexao com o servidor";
  }

  const appError = new Error(message ?? "Erro ao comunicar com o servidor");

  // O status deixa a tela decidir pelo TIPO do erro (409, 404...),
  // e nao comparando o texto da mensagem. Vamos usar na Aula 65.
  appError.status = error.response?.status ?? 0;

  return appError;
}

// A tela usa isto para ignorar buscas canceladas (Aula 63).
export function isCanceled(error) {
  return axios.isCancel(error);
}

// Tira do objeto o que esta vazio. Sem isso, "?search=&categoryId="
// chegaria ao servidor cheio de filtros em branco.
// (Antes o buildQuery montava a string inteira; agora o axios monta,
// e nos so escolhemos o que entra.)
function cleanParams(filters = {}) {
  return Object.fromEntries(
    Object.entries(filters).filter(
      ([, value]) => value !== undefined && value !== null && value !== "" && value !== false
    )
  );
}

export const api = {
  // --- Autenticacao ---
  register: (payload) => http.post("/auth/register", payload),
  login: (payload) => http.post("/auth/login", payload),
  me: () => http.get("/auth/me"),

  // --- Dashboard ---
  getDashboard: () => http.get("/dashboard"),
  getDailyMovements: (days = 30) =>
    http.get("/dashboard/movements-by-day", { params: { days } }),

  // --- Categorias ---
  listCategories: () => http.get("/categories"),
  createCategory: (payload) => http.post("/categories", payload),
  updateCategory: (id, payload) => http.put(`/categories/${id}`, payload),
  deleteCategory: (id) => http.delete(`/categories/${id}`),

  // --- Produtos ---
  // options.signal permite cancelar a busca (veja a secao 6).
  listProducts: (filters = {}, options = {}) =>
    http.get("/products", { params: cleanParams(filters), signal: options.signal }),
  // Busca rapida para o autocomplete (Aula 62).
  searchProducts: (term, options = {}) =>
    http.get("/products/search", {
      params: { q: term, limit: options.limit ?? 8 },
      signal: options.signal,
    }),
  getProduct: (id) => http.get(`/products/${id}`),
  createProduct: (payload) => http.post("/products", payload),
  updateProduct: (id, payload) => http.put(`/products/${id}`, payload),
  deleteProduct: (id) => http.delete(`/products/${id}`),

  // --- Movimentacoes ---
  listMovements: (filters = {}) => http.get("/movements", { params: cleanParams(filters) }),
  createMovement: (payload) => http.post("/movements", payload),

  // --- Relatorios ---
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

// Baixar um arquivo e diferente de buscar JSON: com responseType "blob"
// a resposta nao e convertida, vira um arquivo e o navegador salva.
// O interceptor continua colocando o token - era o motivo de o
// download morar aqui desde a Aula 44.
export async function downloadReport(path, filters, fileName) {
  let blob;

  try {
    blob = await http.get(path, {
      params: cleanParams({ ...filters, format: "csv" }),
      responseType: "blob",
    });
  } catch (error) {
    // Com responseType "blob", ate a mensagem de erro chega como
    // arquivo, e nao como JSON. Por isso uma mensagem propria.
    if (error.status === 401) throw error;

    throw new Error("Nao foi possivel gerar o arquivo");
  }

  const url = URL.createObjectURL(blob);

  // Truque padrao: cria um link invisivel, clica nele e descarta.
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.append(link);
  link.click();
  link.remove();

  // Libera a memoria que o Blob ocupava.
  URL.revokeObjectURL(url);
}
