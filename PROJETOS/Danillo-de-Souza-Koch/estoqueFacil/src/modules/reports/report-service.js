import * as movementRepository from "./movement-report-repository.js";
import * as productRepository from "./product-report-repository.js";

function buildPagination({ page, pageSize }, total) {
  return {
    page,
    pageSize,
    total,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  };
}

export async function getProductReport(filters) {
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

export async function getMovementReport(filters) {
  const [rows, total] = await Promise.all([
    movementRepository.findMovements(filters),
    movementRepository.countMovements(filters),
  ]);

  return {
    pagination: buildPagination(filters, total),
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
    averageCostPrice: Math.round(Number(summary.averageCostPrice) * 100) / 100,
    minSalePrice: Number(summary.minSalePrice),
    maxSalePrice: Number(summary.maxSalePrice),
    outOfStockCount: Number(summary.outOfStockCount ?? 0),
    lowStockCount: Number(summary.lowStockCount ?? 0),
  };
}

export async function getStockByCategory() {
  const rows = await productRepository.getStockByCategory();
  const totalCostValue = rows.reduce(
    (accumulated, row) => accumulated + Number(row.totalCostValue),
    0
  );

  return rows.map((row) => ({
    categoryId: row.categoryId === null ? null : Number(row.categoryId),
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
