import { csvNumber,toCsv } from "../../shared/http/to-csv.js";
import { parseMovementReportFilters,parseProductReportFilters,parseTopProductsOptions } from "./report-filters.js";
import * as service from "./report-service.js";
const PRODUCT_CSV_COLUMNS=[{key:"sku",label:"SKU"},{key:"name",label:"Produto"},{key:"categoryName",label:"Categoria"},{key:"quantity",label:"Quantidade"},{key:"minimumStock",label:"Estoque minimo"},{key:"stockStatus",label:"Situacao"},{key:"costPrice",label:"Preco de custo",format:csvNumber},{key:"salePrice",label:"Preco de venda",format:csvNumber},{key:"stockCostValue",label:"Valor em estoque",format:csvNumber}];
const MOVEMENT_CSV_COLUMNS=[{key:"createdAt",label:"Data"},{key:"productSku",label:"SKU"},{key:"productName",label:"Produto"},{key:"categoryName",label:"Categoria"},{key:"type",label:"Tipo",format:v=>v==="IN"?"Entrada":"Saida"},{key:"quantity",label:"Quantidade"},{key:"userName",label:"Responsavel"},{key:"note",label:"Observacao"}];
const wantsCsv=req=>String(req.query.format??"").toLowerCase()==="csv";
function sendCsv(res,{fileName,rows,columns}){res.setHeader("Content-Type","text/csv; charset=utf-8");res.setHeader("Content-Disposition",`attachment; filename="${fileName}"`);return res.send(toCsv(rows,columns));}
export async function products(req,res){const filters=parseProductReportFilters(req.query);const report=await service.getProductReport(wantsCsv(req)?{...filters,page:1,offset:0,pageSize:200}:filters);return wantsCsv(req)?sendCsv(res,{fileName:"relatorio-produtos.csv",rows:report.rows,columns:PRODUCT_CSV_COLUMNS}):res.json(report);}
export async function stockSummary(req,res){res.json(await service.getStockSummary());}
export async function stockByCategory(req,res){res.json(await service.getStockByCategory());}
export async function productsWithoutMovement(req,res){res.json(await service.getProductsWithoutMovement());}
export async function abcCurve(req,res){res.json(await service.getAbcCurve());}
export async function movements(req,res){const filters=parseMovementReportFilters(req.query);const report=await service.getMovementReport(wantsCsv(req)?{...filters,page:1,offset:0,pageSize:200}:filters);return wantsCsv(req)?sendCsv(res,{fileName:"relatorio-movimentacoes.csv",rows:report.rows,columns:MOVEMENT_CSV_COLUMNS}):res.json(report);}
export async function movementsByUser(req,res){res.json(await service.getMovementsByUser(parseMovementReportFilters(req.query)));}
export async function movementsByMonth(req,res){res.json(await service.getMovementsByMonth(parseMovementReportFilters(req.query)));}
export async function topProducts(req,res){const filters=parseMovementReportFilters(req.query);res.json(await service.getTopProducts(filters,parseTopProductsOptions(req.query)));}
