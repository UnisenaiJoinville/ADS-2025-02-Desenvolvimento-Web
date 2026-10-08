import * as repository from "./dashboard-repository.js";

function buildLast7DaysSeries(rows) {
  // O SQL so devolve dias que tiveram alguma movimentacao.
  // Preenchemos os 7 dias completos aqui, com zero onde faltar.
  const byDay = new Map(rows.map((row) => [row.day, row]));
  const series = [];

  for (let offset = 6; offset >= 0; offset -= 1) {
    const date = new Date();
    date.setDate(date.getDate() - offset);
    const key = date.toISOString().slice(0, 10);

    const found = byDay.get(key);

    series.push({
      day: key,
      unitsIn: Number(found?.unitsIn ?? 0),
      unitsOut: Number(found?.unitsOut ?? 0),
    });
  }

  return series;
}

export async function getDashboard() {
  // As consultas sao independentes: podemos executar em paralelo.
  const [summary, month, byCategory, lowStock, recentMovements, last7DaysRaw] =
    await Promise.all([
      repository.getSummary(),
      repository.getMonthTotals(),
      repository.getStockByCategory(),
      repository.getLowStockProducts(5),
      repository.getRecentMovements(8),
      repository.getLast7DaysMovements(),
    ]);

  const unitsIn = Number(month.unitsIn);
  const unitsOut = Number(month.unitsOut);

  return {
    totals: {
      totalProducts: Number(summary.totalProducts),
      totalUnits: Number(summary.totalUnits),
      stockCostValue: Number(summary.stockCostValue),
      stockSaleValue: Number(summary.stockSaleValue),
      // Lucro potencial se todo o estoque for vendido
      potentialProfit:
        Number(summary.stockSaleValue) - Number(summary.stockCostValue),
      averageSalePrice: Number(summary.averageSalePrice),
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
    last7Days: buildLast7DaysSeries(last7DaysRaw),
  };
}
