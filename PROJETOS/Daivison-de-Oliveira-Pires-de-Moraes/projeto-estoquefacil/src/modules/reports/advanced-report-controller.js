import { AppError } from "../../shared/errors/app-error.js";
import { dateRange } from "../../shared/http/input.js";
import * as service from "./advanced-report-service.js";
export async function stagnant(req, res) {
  res.json(await service.stagnantProducts());
}
export async function turnover(req, res) {
  res.json(
    await service.turnover(dateRange(req.query.startDate, req.query.endDate)),
  );
}
export async function forecast(req, res) {
  res.json(await service.forecast());
}
export async function compare(req, res) {
  const { periodA, periodB } = req.query;
  for (const p of [periodA, periodB])
    if (typeof p !== "string" || !/^[1-9]\d{3}-(0[1-9]|1[0-2])$/.test(p))
      throw new AppError("Use periodA e periodB no formato AAAA-MM");
  res.json(await service.compare(periodA, periodB));
}
