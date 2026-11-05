import { csvNumber, toCsv } from "../../shared/http/to-csv.js";

import {
  parseMovementReportFilters,
  parseProductReportFilters,
  parseTopProductsOptions,
} from "./report-filters.js";
import * as service from "./report-service.js";

// ------------------------------------------------------------------
// O controller dos relatorios faz o de sempre - le a requisicao,
// chama o service, escreve a resposta - e mais uma coisa: decide o
// FORMATO da saida (JSON para a tela, CSV para download).
// ------------------------------------------------------------------

// Colunas do CSV de produtos: ordem e titulos que o usuario vai ver.
const PRODUCT_CSV_COLUMNS = [
  { key: "sku", label: "SKU" },
  { key: "name", label: "Produto" },
  { key: "categoryName", label: "Categoria" },
  { key: "quantity", label: "Quantidade" },
  { key: "minimumStock", label: "Estoque minimo" },
  { key: "stockStatus", label: "Situacao" },
  { key: "costPrice", label: "Preco de custo", format: (value) => csvNumber(value) },
  { key: "salePrice", label: "Preco de venda", format: (value) => csvNumber(value) },
  { key: "stockCostValue", label: "Valor em estoque", format: (value) => csvNumber(value) },
];

const MOVEMENT_CSV_COLUMNS = [
  { key: "createdAt", label: "Data" },
  { key: "productSku", label: "SKU" },
  { key: "productName", label: "Produto" },
  { key: "categoryName", label: "Categoria" },
  { key: "type", label: "Tipo", format: (value) => (value === "IN" ? "Entrada" : "Saida") },
  { key: "quantity", label: "Quantidade" },
  { key: "userName", label: "Responsavel" },
  { key: "note", label: "Observacao" },
];

// Quando o cliente pede ?format=csv, exportamos a selecao INTEIRA,
// e nao so a pagina que esta na tela - ninguem quer baixar 25 linhas
// de um relatorio de 400.
const CSV_PAGE_SIZE = 200;

function wantsCsv(request) {
  return String(request.query.format ?? "").toLowerCase() === "csv";
}

function sendCsv(response, { fileName, rows, columns }) {
  response.setHeader("Content-Type", "text/csv; charset=utf-8");
  // Content-Disposition: attachment faz o navegador BAIXAR o arquivo
  // em vez de tentar exibi-lo.
  response.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);

  response.send(toCsv(rows, columns));
}

export async function products(request, response) {
  const filters = parseProductReportFilters(request.query);

  if (wantsCsv(request)) {
    const report = await service.getProductReport({
      ...filters,
      page: 1,
      offset: 0,
      pageSize: CSV_PAGE_SIZE,
    });

    return sendCsv(response, {
      fileName: "relatorio-produtos.csv",
      rows: report.rows,
      columns: PRODUCT_CSV_COLUMNS,
    });
  }

  const report = await service.getProductReport(filters);

  return response.json(report);
}

export async function stockSummary(request, response) {
  const summary = await service.getStockSummary();

  response.json(summary);
}

export async function stockByCategory(request, response) {
  const rows = await service.getStockByCategory();

  response.json(rows);
}

export async function productsWithoutMovement(request, response) {
  const rows = await service.getProductsWithoutMovement();

  response.json(rows);
}

export async function abcCurve(request, response) {
  const rows = await service.getAbcCurve();

  response.json(rows);
}

export async function movements(request, response) {
  const filters = parseMovementReportFilters(request.query);

  if (wantsCsv(request)) {
    const report = await service.getMovementReport({
      ...filters,
      page: 1,
      offset: 0,
      pageSize: CSV_PAGE_SIZE,
    });

    return sendCsv(response, {
      fileName: "relatorio-movimentacoes.csv",
      rows: report.rows,
      columns: MOVEMENT_CSV_COLUMNS,
    });
  }

  const report = await service.getMovementReport(filters);

  return response.json(report);
}

export async function movementsByUser(request, response) {
  const filters = parseMovementReportFilters(request.query);
  const rows = await service.getMovementsByUser(filters);

  response.json(rows);
}

export async function movementsByMonth(request, response) {
  const filters = parseMovementReportFilters(request.query);
  const rows = await service.getMovementsByMonth(filters);

  response.json(rows);
}

export async function topProducts(request, response) {
  const filters = parseMovementReportFilters(request.query);

  const rows = await service.getTopProducts(filters, parseTopProductsOptions(request.query));

  response.json(rows);
}
