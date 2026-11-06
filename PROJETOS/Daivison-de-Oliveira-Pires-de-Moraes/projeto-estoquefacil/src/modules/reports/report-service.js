import { cacheVersion } from "../../shared/http/cache-version.js";
import { buildPagination } from "../../shared/http/pagination.js";
import * as movementRepository from "./movement-report-repository.js";
import * as productRepository from "./product-report-repository.js";

// ------------------------------------------------------------------
// O service dos relatorios tem duas tarefas:
//   1. orquestrar as consultas (varias delas rodam em paralelo);
//   2. montar o envelope que o front recebe, sempre no mesmo formato.
//
// Ele continua sem saber o que e request, response ou SQL.
// ------------------------------------------------------------------

// Todo relatorio paginado devolve o mesmo envelope. Padronizar isso
// aqui evita que cada tela do front invente um jeito de ler a resposta.
// --- Produtos e estoque -------------------------------------------

export async function getProductReport(filters) {
  // As tres consultas sao independentes entre si: nenhuma precisa
  // do resultado da outra. Promise.all roda as tres ao mesmo tempo.
  const [rows, total, totals] = await Promise.all([
    productRepository.findProducts(filters),
    productRepository.countProducts(filters),
    productRepository.sumProducts(filters),
  ]);

  return {
    pagination: buildPagination(filters, total),
    totals: {
      totalUnits: Number(totals.totalUnits),
      totalCostValue: Number(totals.totalCostValue),
      totalSaleValue: Number(totals.totalSaleValue),
      potentialProfit:
        Number(totals.totalSaleValue) - Number(totals.totalCostValue),
    },
    sort: { key: filters.sort.key, direction: filters.direction.toLowerCase() },
    rows,
  };
}

let summaryCache;
export async function getStockSummary() {
  const version = cacheVersion();
  if (summaryCache?.version === version && summaryCache.expires > Date.now())
    return summaryCache.data;
  const summary = await productRepository.getStockSummary();

  const totalCostValue = Number(summary.totalCostValue);
  const totalSaleValue = Number(summary.totalSaleValue);

  const data = {
    productCount: Number(summary.productCount),
    categoryCount: Number(summary.categoryCount),
    totalUnits: Number(summary.totalUnits),
    totalCostValue,
    totalSaleValue,
    potentialProfit: totalSaleValue - totalCostValue,
    // AVG devolve muitas casas decimais. Dinheiro mostra duas.
    averageCostPrice: Math.round(Number(summary.averageCostPrice) * 100) / 100,
    minSalePrice: Number(summary.minSalePrice),
    maxSalePrice: Number(summary.maxSalePrice),
    outOfStockCount: Number(summary.outOfStockCount ?? 0),
    lowStockCount: Number(summary.lowStockCount ?? 0),
  };
  summaryCache = { version, expires: Date.now() + 60000, data };
  return data;
}

export async function getStockByCategory() {
  const rows = await productRepository.getStockByCategory();

  // O percentual nao vem do SQL: ele depende do total de TODAS as
  // linhas, e calcular isso em JavaScript e mais simples de ler.
  const totalCostValue = rows.reduce(
    (accumulated, row) => accumulated + Number(row.totalCostValue),
    0,
  );

  return rows.map((row) => ({
    categoryId: row.categoryId,
    categoryName: row.categoryName,
    productCount: Number(row.productCount),
    totalUnits: Number(row.totalUnits),
    totalCostValue: Number(row.totalCostValue),
    totalSaleValue: Number(row.totalSaleValue),
    sharePercent:
      totalCostValue > 0
        ? Math.round((Number(row.totalCostValue) / totalCostValue) * 10000) /
          100
        : 0,
  }));
}

export async function getProductsWithoutMovement() {
  return productRepository.findProductsWithoutMovement();
}

export async function getAbcCurve() {
  const rows = await productRepository.getAbcCurve();

  return rows.map((row) => ({
    ...row,
    stockCostValue: Number(row.stockCostValue),
    sharePercent: Number(row.sharePercent ?? 0),
  }));
}

// --- Movimentacoes ------------------------------------------------

export async function getMovementReport(filters) {
  const [rows, total, totals] = await Promise.all([
    movementRepository.findMovements(filters),
    movementRepository.countMovements(filters),
    movementRepository.sumMovements(filters),
  ]);

  const unitsIn = Number(totals.unitsIn);
  const unitsOut = Number(totals.unitsOut);

  return {
    pagination: buildPagination(filters, total),
    totals: {
      unitsIn,
      unitsOut,
      unitsAdjusted: Number(totals.unitsAdjusted ?? 0),
      balance: unitsIn - unitsOut + Number(totals.unitsAdjusted ?? 0),
    },
    sort: { key: filters.sort.key, direction: filters.direction.toLowerCase() },
    rows,
  };
}

export async function getMovementsByUser(filters) {
  const rows = await movementRepository.getMovementsByUser(filters);

  return rows.map((row) => {
    const unitsIn = Number(row.unitsIn);
    const unitsOut = Number(row.unitsOut);

    return {
      userId: row.userId,
      userName: row.userName,
      userEmail: row.userEmail,
      movementCount: Number(row.movementCount),
      entriesCount: Number(row.entriesCount),
      exitsCount: Number(row.exitsCount),
      productCount: Number(row.productCount),
      unitsIn,
      unitsOut,
      unitsAdjusted: Number(row.unitsAdjusted ?? 0),
      balance: unitsIn - unitsOut + Number(row.unitsAdjusted ?? 0),
      firstMovementAt: row.firstMovementAt,
      lastMovementAt: row.lastMovementAt,
    };
  });
}

export async function getMovementsByMonth(filters) {
  return (await movementRepository.getMovementsByMonth(filters)).map((row) => ({
    ...row,
    movementCount: Number(row.movementCount),
    unitsIn: Number(row.unitsIn),
    unitsOut: Number(row.unitsOut),
    productCount: Number(row.productCount),
    unitsAdjusted: Number(row.unitsAdjusted ?? 0),
    balance:
      Number(row.unitsIn) -
      Number(row.unitsOut) +
      Number(row.unitsAdjusted ?? 0),
  }));
}

export async function getTopProducts(filters, options) {
  const rows = await movementRepository.getTopProducts(filters, options);

  return rows.map((row) => ({
    ...row,
    currentStock: Number(row.currentStock),
    movementCount: Number(row.movementCount),
    unitsIn: Number(row.unitsIn),
    unitsOut: Number(row.unitsOut),
    unitsMoved: Number(row.unitsMoved),
  }));
}
