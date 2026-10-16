import { api, downloadReport } from "./api.js";
import { requireAuth } from "./auth.js";
import { currency, formatDateTime, mountLayout } from "./layout.js";

const { createApp } = Vue;

mountLayout("/relatorios.html");

const EMPTY_PRODUCT_REPORT = {
  pagination: { page: 1, pageSize: 25, total: 0, totalPages: 1 },
  totals: { totalUnits: 0, totalCostValue: 0, totalSaleValue: 0, potentialProfit: 0 },
  rows: [],
};

const EMPTY_MOVEMENT_REPORT = {
  pagination: { page: 1, pageSize: 25, total: 0, totalPages: 1 },
  totals: { unitsIn: 0, unitsOut: 0, balance: 0 },
  rows: [],
};

if (requireAuth()) {
  createApp({
    data() {
      return {
        activeTab: "products",
        tabs: [
          { id: "products", label: "Produtos" },
          { id: "movements", label: "Movimentacoes" },
          { id: "summaries", label: "Resumos" },
          { id: "analysis", label: "Analises" },
        ],
        productColumns: [
          { key: "sku", label: "SKU" },
          { key: "name", label: "Produto" },
          { key: "category", label: "Categoria" },
          { key: "quantity", label: "Qtd.", align: "right" },
          { key: "minimumStock", label: "Minimo", align: "right" },
          { key: "costPrice", label: "Custo", align: "right" },
          { key: "salePrice", label: "Venda", align: "right" },
          { key: "stockValue", label: "Valor", align: "right" },
        ],
        movementColumns: [
          { key: "date", label: "Data" },
          { key: "product", label: "Produto" },
          { key: "category", label: "Categoria" },
          { key: "type", label: "Tipo" },
          { key: "quantity", label: "Quantidade" },
          { key: "user", label: "Responsavel" },
          { key: "note", label: "Observacao" },
        ],
        summary: null,
        categories: [],
        productReport: { ...EMPTY_PRODUCT_REPORT },
        movementReport: { ...EMPTY_MOVEMENT_REPORT },
        movementFilters: {
          categoryId: "",
          type: "",
          startDate: "",
          endDate: "",
          page: 1,
          pageSize: 25,
          sort: "date",
          direction: "desc",
        },
        productFilters: {
          search: "",
          categoryId: "",
          stockStatus: "ALL",
          withoutCategory: false,
          page: 1,
          pageSize: 25,
          sort: "name",
          direction: "asc",
        },
        stockByCategory: [],
        movementsByMonth: [],
        movementsByUser: [],
        topProducts: [],
        productsWithoutMovement: [],
        abcCurve: [],
        loading: {
          summary: false,
          products: false,
          movements: false,
          summaries: false,
          analysis: false,
        },
        errors: {
          summary: "",
          products: "",
          movements: "",
          summaries: "",
          analysis: "",
        },
        summariesLoaded: false,
        analysisLoaded: false,
        movementsLoaded: false,
        searchTimer: null,
        productRequestId: 0,
        movementRequestId: 0,
      };
    },

    computed: {
      summaryCards() {
        if (!this.summary) return [];

        return [
          {
            label: "Produtos ativos",
            value: this.summary.productCount,
            hint: `${this.summary.totalUnits} unidades em estoque`,
          },
          {
            label: "Valor de custo",
            value: currency.format(this.summary.totalCostValue),
            hint: `Custo medio ${currency.format(this.summary.averageCostPrice)}`,
          },
          {
            label: "Valor de venda",
            value: currency.format(this.summary.totalSaleValue),
            hint: `Lucro potencial ${currency.format(this.summary.potentialProfit)}`,
          },
          {
            label: "Precisam de atencao",
            value: this.summary.lowStockCount + this.summary.outOfStockCount,
            hint: `${this.summary.outOfStockCount} zerado(s), ${this.summary.lowStockCount} abaixo do minimo`,
          },
        ];
      },
      productRangeLabel() {
        return this.rangeLabel(this.productReport.pagination);
      },
      movementRangeLabel() {
        return this.rangeLabel(this.movementReport.pagination);
      },
      movementTotals() {
        const totals = this.movementReport.totals;

        return [
          { label: "Unidades recebidas", value: totals.unitsIn },
          { label: "Unidades retiradas", value: totals.unitsOut },
          { label: "Saldo do periodo", value: totals.balance },
        ];
      },
    },

    async mounted() {
      await Promise.all([this.loadSummary(), this.loadCategories(), this.loadProducts()]);
    },

    beforeUnmount() {
      window.clearTimeout(this.searchTimer);
    },

    methods: {
      money(value) {
        return currency.format(Number(value ?? 0));
      },
      formatDate(value) {
        return formatDateTime(value);
      },
      statusClass(status) {
        return {
          OUT: "bg-rose-100 text-rose-700",
          LOW: "bg-amber-100 text-amber-700",
          OK: "bg-emerald-100 text-emerald-700",
        }[status] ?? "bg-slate-100 text-slate-700";
      },
      rangeLabel({ page, pageSize, total }) {
        const first = (page - 1) * pageSize + 1;
        const last = Math.min(page * pageSize, total);

        return `${first}-${last}`;
      },
      productQuery() {
        return {
          ...this.productFilters,
          categoryId: this.productFilters.categoryId || "",
          withoutCategory: this.productFilters.withoutCategory || "",
        };
      },
      movementQuery() {
        return {
          ...this.movementFilters,
          categoryId: this.movementFilters.categoryId || "",
        };
      },
      async loadSummary() {
        this.loading.summary = true;
        this.errors.summary = "";

        try {
          this.summary = await api.reportStockSummary();
        } catch (error) {
          this.errors.summary = error.message;
        } finally {
          this.loading.summary = false;
        }
      },
      async loadCategories() {
        try {
          this.categories = await api.listCategories();
        } catch (error) {
          this.errors.summary = error.message;
        }
      },
      async loadProducts() {
        const requestId = ++this.productRequestId;
        this.loading.products = true;
        this.errors.products = "";

        try {
          const report = await api.reportProducts(this.productQuery());

          if (requestId === this.productRequestId) {
            this.productReport = report;
          }
        } catch (error) {
          if (requestId === this.productRequestId) {
            this.errors.products = error.message;
            this.productReport = { ...EMPTY_PRODUCT_REPORT };
          }
        } finally {
          if (requestId === this.productRequestId) {
            this.loading.products = false;
          }
        }
      },
      async loadMovements() {
        const requestId = ++this.movementRequestId;
        this.loading.movements = true;
        this.errors.movements = "";

        try {
          const report = await api.reportMovements(this.movementQuery());

          if (requestId === this.movementRequestId) {
            this.movementReport = report;
            this.movementsLoaded = true;
          }
        } catch (error) {
          if (requestId === this.movementRequestId) {
            this.errors.movements = error.message;
            this.movementReport = { ...EMPTY_MOVEMENT_REPORT };
            this.movementsLoaded = false;
          }
        } finally {
          if (requestId === this.movementRequestId) {
            this.loading.movements = false;
          }
        }
      },
      async loadSummaries() {
        this.loading.summaries = true;
        this.errors.summaries = "";

        try {
          const [stockByCategory, movementsByMonth, movementsByUser] = await Promise.all([
            api.reportStockByCategory(),
            api.reportMovementsByMonth(this.movementQuery()),
            api.reportMovementsByUser(this.movementQuery()),
          ]);
          this.stockByCategory = stockByCategory;
          this.movementsByMonth = movementsByMonth;
          this.movementsByUser = movementsByUser;
          this.summariesLoaded = true;
        } catch (error) {
          this.errors.summaries = error.message;
        } finally {
          this.loading.summaries = false;
        }
      },
      async loadAnalysis() {
        this.loading.analysis = true;
        this.errors.analysis = "";

        try {
          const [topProducts, productsWithoutMovement, abcCurve] = await Promise.all([
            api.reportTopProducts(this.movementQuery()),
            api.reportProductsWithoutMovement(),
            api.reportAbcCurve(),
          ]);
          this.topProducts = topProducts;
          this.productsWithoutMovement = productsWithoutMovement;
          this.abcCurve = abcCurve;
          this.analysisLoaded = true;
        } catch (error) {
          this.errors.analysis = error.message;
        } finally {
          this.loading.analysis = false;
        }
      },
      async changeTab(tabId) {
        this.activeTab = tabId;

        if (tabId === "movements" && (!this.movementsLoaded || this.errors.movements)) {
          await this.loadMovements();
        }
        if (tabId === "summaries" && (!this.summariesLoaded || this.errors.summaries)) {
          await this.loadSummaries();
        }
        if (tabId === "analysis" && (!this.analysisLoaded || this.errors.analysis)) {
          await this.loadAnalysis();
        }
      },
      debouncedProductSearch() {
        window.clearTimeout(this.searchTimer);
        this.searchTimer = window.setTimeout(() => this.resetAndLoadProducts(), 400);
      },
      resetAndLoadProducts() {
        this.productFilters.page = 1;
        this.loadProducts();
      },
      resetAndLoadMovements() {
        this.movementFilters.page = 1;
        this.loadMovements();

        if (this.summariesLoaded) this.loadSummaries();
        if (this.analysisLoaded) this.loadAnalysis();
      },
      clearProductFilters() {
        this.productFilters.search = "";
        this.productFilters.categoryId = "";
        this.productFilters.stockStatus = "ALL";
        this.productFilters.withoutCategory = false;
        this.productFilters.sort = "name";
        this.productFilters.direction = "asc";
        this.resetAndLoadProducts();
      },
      clearMovementFilters() {
        this.movementFilters.categoryId = "";
        this.movementFilters.type = "";
        this.movementFilters.startDate = "";
        this.movementFilters.endDate = "";
        this.movementFilters.sort = "date";
        this.movementFilters.direction = "desc";
        this.resetAndLoadMovements();
      },
      sortProducts(key) {
        if (this.productFilters.sort === key) {
          this.productFilters.direction = this.productFilters.direction === "asc" ? "desc" : "asc";
        } else {
          this.productFilters.sort = key;
          this.productFilters.direction = "asc";
        }

        this.resetAndLoadProducts();
      },
      sortMovements(key) {
        if (this.movementFilters.sort === key) {
          this.movementFilters.direction = this.movementFilters.direction === "asc" ? "desc" : "asc";
        } else {
          this.movementFilters.sort = key;
          this.movementFilters.direction = "asc";
        }

        this.resetAndLoadMovements();
      },
      changeProductPage(page) {
        if (page < 1 || page > this.productReport.pagination.totalPages) return;

        this.productFilters.page = page;
        this.loadProducts();
      },
      changeMovementPage(page) {
        if (page < 1 || page > this.movementReport.pagination.totalPages) return;

        this.movementFilters.page = page;
        this.loadMovements();
      },
      async exportProducts() {
        try {
          await downloadReport("/reports/products", this.productQuery(), "relatorio-produtos.csv");
        } catch (error) {
          this.errors.products = error.message;
        }
      },
      async exportMovements() {
        try {
          await downloadReport(
            "/reports/movements",
            this.movementQuery(),
            "relatorio-movimentacoes.csv"
          );
        } catch (error) {
          this.errors.movements = error.message;
        }
      },
    },
  }).mount("#app");
}
