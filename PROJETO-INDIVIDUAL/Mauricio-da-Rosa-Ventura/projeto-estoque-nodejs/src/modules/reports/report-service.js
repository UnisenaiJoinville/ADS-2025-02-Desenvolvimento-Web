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
function buildPagination({ page, pageSize }, total) {
  return {
    page,
    pageSize,
    total,
    // Math.ceil: 26 registros de 25 em 25 sao 2 paginas, nao 1,04.
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  };
}

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
      potentialProfit: Number(totals.totalSaleValue) - Number(totals.totalCostValue),
    },
    sort: { key: filters.sort.key, direction: filters.direction.toLowerCase() },
    rows,
  };
}

export async function getStockSummary() {
  const summary = await productRepository.getStockSummary();

  const totalCostValue = Number(summary.totalCostValue);
  const totalSaleValue = Number(summary.totalSaleValue);

  return {
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
}

export async function getStockByCategory() {
  const rows = await productRepository.getStockByCategory();

  // O percentual nao vem do SQL: ele depende do total de TODAS as
  // linhas, e calcular isso em JavaScript e mais simples de ler.
  const totalCostValue = rows.reduce(
    (accumulated, row) => accumulated + Number(row.totalCostValue),
    0
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
        ? Math.round((Number(row.totalCostValue) / totalCostValue) * 10000) / 100
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
    totals: { unitsIn, unitsOut, balance: unitsIn - unitsOut },
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
      balance: unitsIn - unitsOut,
      firstMovementAt: row.firstMovementAt,
      lastMovementAt: row.lastMovementAt,
    };
  });
}

export async function getMovementsByMonth(filters) {
  return movementRepository.getMovementsByMonth(filters);
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
