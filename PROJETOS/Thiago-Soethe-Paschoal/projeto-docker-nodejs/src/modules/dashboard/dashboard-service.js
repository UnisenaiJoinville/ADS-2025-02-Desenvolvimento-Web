import * as repository from "./dashboard-repository.js";

export async function getDashboard() {
  // As consultas sao independentes: podemos executar em paralelo.
  const [summary, month, byCategory, lowStock, recentMovements] = await Promise.all([
    repository.getSummary(),
    repository.getMonthTotals(),
    repository.getStockByCategory(),
    repository.getLowStockProducts(5),
    repository.getRecentMovements(8),
  ]);

  const unitsIn = Number(month.unitsIn);
  const unitsOut = Number(month.unitsOut);

  return {
    totals: {
      totalProducts: Number(summary.totalProducts),
      totalUnits: Number(summary.totalUnits),
      stockCostValue: Number(summary.stockCostValue),
      stockSaleValue: Number(summary.stockSaleValue),
      averageSalePrice: Number(summary.averageSalePrice),
      // Lucro potencial se todo o estoque for vendido
      potentialProfit:
        Number(summary.stockSaleValue) - Number(summary.stockCostValue),
      lowStockCount: Number(summary.lowStockCount ?? 0),
      outOfStockCount: Number(summary.outOfStockCount ?? 0),
    },
    month: {
      unitsIn,
      unitsOut,
      balance: unitsIn - unitsOut,
    },
    byCategory: byCategory.map((row) => ({
      categoryName: row.categoryName,
      productCount: Number(row.productCount),
      units: Number(row.units),
      costValue: Number(row.costValue),
    })),
    lowStock,
    recentMovements,
  };
}
