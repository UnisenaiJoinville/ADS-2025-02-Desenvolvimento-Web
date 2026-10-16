import { api, downloadReport } from "./api.js";
import { requireAuth } from "./auth.js";
import { currency, formatDateTime, mountLayout } from "./layout.js";

const { createApp, nextTick } = Vue;
mountLayout("/relatorios.html");

const emptyProducts = () => ({ pagination: { page: 1, pageSize: 25, total: 0, totalPages: 1 }, totals: { totalUnits: 0, totalCostValue: 0, totalSaleValue: 0, potentialProfit: 0 }, rows: [] });
const emptyMovements = () => ({ pagination: { page: 1, pageSize: 25, total: 0, totalPages: 1 }, totals: { unitsIn: 0, unitsOut: 0, balance: 0 }, rows: [] });
const defaultProductFilters = () => ({ search: "", categoryId: "", stockStatus: "ALL", withoutCategory: false, sort: "name", direction: "asc", page: 1, pageSize: 25 });
const defaultMovementFilters = () => ({ categoryId: "", type: "", startDate: "", endDate: "", sort: "date", direction: "desc", page: 1, pageSize: 25 });

if (requireAuth()) createApp({
  data() {
    return {
      activeTab: "products",
      tabs: [{ id: "products", label: "Produtos" }, { id: "movements", label: "Movimentacoes" }, { id: "summaries", label: "Resumos" }, { id: "analysis", label: "Analises" }],
      summary: null, categories: [], products: emptyProducts(), movements: emptyMovements(),
      stockByCategory: [], movementsByUser: [], movementsByMonth: [], abcCurve: [], topProducts: [], productsWithoutMovement: [],
      productFilters: defaultProductFilters(), movementFilters: defaultMovementFilters(), searchTimer: null, suspendWatchers: false,
      loading: { products: false, movements: false, summaries: false, analysis: false },
      errors: { summary: "", products: "", movements: "", summaries: "", analysis: "" },
      productColumns: [{ key: "sku", label: "SKU" }, { key: "name", label: "Produto" }, { key: "category", label: "Categoria" }, { key: "quantity", label: "Qtd." }, { key: "minimumStock", label: "Minimo" }, { key: "costPrice", label: "Custo" }, { key: "salePrice", label: "Venda" }, { key: "stockValue", label: "Valor" }],
    };
  },
  computed: {
    cards() { if (!this.summary) return []; return [{ label: "Produtos ativos", value: this.summary.productCount, hint: `${this.summary.totalUnits} unidades` }, { label: "Valor de custo", value: this.money(this.summary.totalCostValue), hint: `Custo medio ${this.money(this.summary.averageCostPrice)}` }, { label: "Valor de venda", value: this.money(this.summary.totalSaleValue), hint: `Lucro potencial ${this.money(this.summary.potentialProfit)}` }, { label: "Precisam de atencao", value: this.summary.lowStockCount + this.summary.outOfStockCount, hint: `${this.summary.outOfStockCount} zerados e ${this.summary.lowStockCount} baixos` }]; },
    productRange() { return this.rangeLabel(this.products.pagination); },
    movementRange() { return this.rangeLabel(this.movements.pagination); },
    productFilterSummary() {
      const parts = [];
      if (this.productFilters.search) parts.push(`busca "${this.productFilters.search}"`);
      if (this.productFilters.categoryId) parts.push(`categoria ${this.categoryName(this.productFilters.categoryId)}`);
      if (this.productFilters.stockStatus !== "ALL") parts.push(this.statusLabel(this.productFilters.stockStatus));
      if (this.productFilters.withoutCategory) parts.push("somente sem categoria");
      return parts.length ? `Filtros ativos: ${parts.join(" · ")}` : "Sem filtros aplicados";
    },
    movementFilterSummary() {
      const parts = [];
      if (this.movementFilters.categoryId) parts.push(`categoria ${this.categoryName(this.movementFilters.categoryId)}`);
      if (this.movementFilters.type) parts.push(this.movementFilters.type === "IN" ? "entradas" : "saidas");
      if (this.movementFilters.startDate) parts.push(`desde ${this.movementFilters.startDate}`);
      if (this.movementFilters.endDate) parts.push(`ate ${this.movementFilters.endDate}`);
      return parts.length ? `Filtros ativos: ${parts.join(" · ")}` : "Sem filtros aplicados";
    },
  },
  watch: {
    "productFilters.search"() { if (this.suspendWatchers) return; clearTimeout(this.searchTimer); this.searchTimer = setTimeout(() => this.resetAndLoadProducts(), 400); },
    "productFilters.categoryId"() { if (!this.suspendWatchers) this.resetAndLoadProducts(); },
    "productFilters.stockStatus"() { if (!this.suspendWatchers) this.resetAndLoadProducts(); },
    "productFilters.withoutCategory"() { if (!this.suspendWatchers) this.resetAndLoadProducts(); },
    "movementFilters.categoryId"() { if (!this.suspendWatchers) this.resetAndLoadMovements(); },
    "movementFilters.type"() { if (!this.suspendWatchers) this.resetAndLoadMovements(); },
    "movementFilters.startDate"() { if (!this.suspendWatchers) this.resetAndLoadMovements(); },
    "movementFilters.endDate"() { if (!this.suspendWatchers) this.resetAndLoadMovements(); },
  },
  async mounted() { await Promise.all([this.loadSummary(), this.loadCategories()]); await this.loadProducts(); },
  methods: {
    money(value) { return currency.format(Number(value ?? 0)); },
    dateTime: formatDateTime,
    monthLabel(period) { const [year, month] = period.split("-"); return `${["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"][Number(month) - 1]}/${year}`; },
    categoryName(id) { return this.categories.find((category) => String(category.id) === String(id))?.name ?? id; },
    statusLabel(status) { return ({ OK: "Estoque normal", LOW: "Estoque baixo", OUT: "Produto zerado" })[status] ?? status; },
    statusClass(status) { return ({ OK: "bg-emerald-100 text-emerald-700", LOW: "bg-amber-100 text-amber-700", OUT: "bg-rose-100 text-rose-700" })[status]; },
    productRowClass(status) { return ({ OK: "hover:bg-emerald-50", LOW: "bg-amber-50", OUT: "bg-rose-50" })[status]; },
    rangeLabel(pagination) { if (!pagination.total) return "0"; const first = (pagination.page - 1) * pagination.pageSize + 1; return `${first}–${Math.min(pagination.page * pagination.pageSize, pagination.total)}`; },
    async run(area, work) { this.loading[area] = true; this.errors[area] = ""; try { await work(); } catch (error) { this.errors[area] = error.message; } finally { this.loading[area] = false; } },
    loadSummary() { this.errors.summary = ""; return api.reportStockSummary().then((data) => { this.summary = data; }).catch((error) => { this.errors.summary = error.message; }); },
    loadCategories() { return api.listCategories().then((data) => { this.categories = data; }).catch((error) => { this.errors.products = error.message; }); },
    loadProducts() { return this.run("products", async () => { this.products = await api.reportProducts(this.productFilters); }); },
    loadMovements() { return this.run("movements", async () => { this.movements = await api.reportMovements(this.movementFilters); }); },
    resetAndLoadProducts() { this.productFilters.page = 1; return this.loadProducts(); },
    resetAndLoadMovements() { if (this.activeTab !== "movements") return; this.movementFilters.page = 1; return this.loadMovements(); },
    async clearProductFilters() { clearTimeout(this.searchTimer); this.suspendWatchers = true; this.productFilters = defaultProductFilters(); await nextTick(); this.suspendWatchers = false; await this.loadProducts(); },
    async clearMovementFilters() { this.suspendWatchers = true; this.movementFilters = defaultMovementFilters(); await nextTick(); this.suspendWatchers = false; await this.loadMovements(); },
    sortProducts(key) { if (this.productFilters.sort === key) this.productFilters.direction = this.productFilters.direction === "asc" ? "desc" : "asc"; else { this.productFilters.sort = key; this.productFilters.direction = "asc"; } this.productFilters.page = 1; this.loadProducts(); },
    changeProductPage(delta) { this.productFilters.page += delta; this.loadProducts(); },
    changeMovementPage(delta) { this.movementFilters.page += delta; this.loadMovements(); },
    exportProducts() { return this.run("products", () => downloadReport("/reports/products", this.productFilters, "relatorio-produtos.csv")); },
    exportMovements() { return this.run("movements", () => downloadReport("/reports/movements", this.movementFilters, "relatorio-movimentacoes.csv")); },
    async loadSummaries() { await this.run("summaries", async () => { [this.stockByCategory, this.movementsByUser, this.movementsByMonth] = await Promise.all([api.reportStockByCategory(), api.reportMovementsByUser(this.movementFilters), api.reportMovementsByMonth(this.movementFilters)]); }); },
    async loadAnalysis() { await this.run("analysis", async () => { [this.abcCurve, this.topProducts, this.productsWithoutMovement] = await Promise.all([api.reportAbcCurve(), api.reportTopProducts(), api.reportProductsWithoutMovement()]); }); },
    async changeTab(id) { this.activeTab = id; if (id === "movements" && !this.movements.rows.length) await this.loadMovements(); if (id === "summaries" && !this.stockByCategory.length) await this.loadSummaries(); if (id === "analysis" && !this.abcCurve.length) await this.loadAnalysis(); },
  },
}).mount("#app");
