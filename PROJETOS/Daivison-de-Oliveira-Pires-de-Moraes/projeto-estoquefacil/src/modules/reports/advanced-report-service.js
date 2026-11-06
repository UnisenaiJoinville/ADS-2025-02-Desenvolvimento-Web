import * as repo from "./advanced-report-repository.js";
export const stagnantProducts = () => repo.stagnantProducts();
export async function turnover(filters) {
  return (await repo.turnoverByCategory(filters)).map((r) => ({
    ...r,
    unitsIn: Number(r.unitsIn),
    unitsOut: Number(r.unitsOut),
    balance: Number(r.unitsIn) - Number(r.unitsOut),
  }));
}
export async function forecast() {
  return (await repo.stockoutForecast()).map((r) => ({
    ...r,
    averageDailyOut: Number(r.averageDailyOut),
    daysRemaining: r.daysRemaining === null ? null : Number(r.daysRemaining),
  }));
}
export async function compare(a, b) {
  const rows = await repo.comparePeriods(a, b);
  const get = (period) => {
    const r = rows.find((r) => r.period === period);
    return {
      period,
      unitsIn: Number(r?.unitsIn ?? 0),
      unitsOut: Number(r?.unitsOut ?? 0),
    };
  };
  const periodA = get(a),
    periodB = get(b);
  const variation = (v1, v2) =>
    v1 === 0
      ? v2 === 0
        ? 0
        : null
      : Math.round(((v2 - v1) / v1) * 10000) / 100;
  return {
    periodA,
    periodB,
    variationPercent: {
      unitsIn: variation(periodA.unitsIn, periodB.unitsIn),
      unitsOut: variation(periodA.unitsOut, periodB.unitsOut),
    },
  };
}
