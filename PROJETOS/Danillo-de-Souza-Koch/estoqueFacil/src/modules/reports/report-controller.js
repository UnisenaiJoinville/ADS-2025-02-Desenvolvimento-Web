import {
  parseMovementReportFilters,
  parseProductReportFilters,
} from "./report-filters.js";
import * as service from "./report-service.js";

export async function products(request, response) {
  const filters = parseProductReportFilters(request.query);
  const report = await service.getProductReport(filters);

  response.json(report);
}

export async function movements(request, response) {
  const filters = parseMovementReportFilters(request.query);
  const report = await service.getMovementReport(filters);

  response.json(report);
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
