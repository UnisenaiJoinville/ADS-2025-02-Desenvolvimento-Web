import { api, downloadReport } from "./api.js";
import { requireAuth } from "./auth.js";
import { currency, formatDateTime, mountLayout } from "./layout.js";

const { createApp } = Vue;

// Menu e porteiro continuam iguais aos das outras telas: o Vue
// cuida so do conteudo, nao do layout em volta.
mountLayout("/relatorios.html");

// Quanto tempo esperar depois da ultima tecla antes de consultar
// a API. Sem isso, "caneta" dispararia 6 requisicoes.
const SEARCH_DEBOUNCE_MS = 400;

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

function defaultProductFilters() {
  return {
    search: "",
    categoryId: "",
    stockStatus: "ALL",
    withoutCategory: false,
    sort: "name",
    direction: "asc",
    page: 1,
    pageSize: 25,
  };
}

function defaultMovementFilters() {
  return {
    categoryId: "",
    type: "",
    startDate: "",
    endDate: "",
    sort: "date",
    direction: "desc",
    page: 1,
    pageSize: 25,
  };
}

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

        categories: [],
        summary: null,

        productFilters: defaultProductFilters(),
        productReport: EMPTY_PRODUCT_REPORT,
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

        movementFilters: defaultMovementFilters(),
        movementReport: EMPTY_MOVEMENT_REPORT,

        stockByCategory: [],
        movementsByUser: [],
        movementsByMonth: [],

        topProducts: [],
        productsWithoutMovement: [],
        abcCurve: [],

        loading: { products: false, movements: false, summaries: false, analysis: false },
        errors: { products: "", movements: "", summaries: "", analysis: "" },

        // Guarda o timer do debounce entre uma tecla e outra.
        searchTimer: null,
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
            accent: "bg-slate-900",
          },
          {
            label: "Valor de custo",
            value: currency.format(this.summary.totalCostValue),
            hint: `Preco medio de custo ${currency.format(this.summary.averageCostPrice)}`,
            accent: "bg-sky-500",
          },
          {
            label: "Valor de venda",
            value: currency.format(this.summary.totalSaleValue),
            hint: `Lucro potencial de ${currency.format(this.summary.potentialProfit)}`,
            accent: "bg-emerald-500",
          },
          {
            label: "Precisam de atencao",
            value: this.summary.lowStockCount + this.summary.outOfStockCount,
            hint: `${this.summary.outOfStockCount} zerado(s), ${this.summary.lowStockCount} abaixo do minimo`,
            accent: "bg-rose-500",
          },
        ];
      },

      // Converte o estado da tela no objeto que a API espera.
      // Os campos vazios somem no buildQuery do api.js.
      productQuery() {
        return {
          search: this.productFilters.search,
          categoryId: this.productFilters.categoryId,
          stockStatus: this.productFilters.stockStatus,
          withoutCategory: this.productFilters.withoutCategory,
          sort: this.productFilters.sort,
          direction: this.productFilters.direction,
          page: this.productFilters.page,
          pageSize: this.productFilters.pageSize,
        };
      },

      movementQuery() {
        return {
          categoryId: this.movementFilters.categoryId,
          type: this.movementFilters.type,
          startDate: this.movementFilters.startDate,
          endDate: this.movementFilters.endDate,
          sort: this.movementFilters.sort,
          direction: this.movementFilters.direction,
          page: this.movementFilters.page,
          pageSize: this.movementFilters.pageSize,
        };
      },

      productFilterSummary() {
        const parts = [];

        if (this.productFilters.search) parts.push(`texto "${this.productFilters.search}"`);
        if (this.productFilters.categoryId) {
          const category = this.categories.find(
            (item) => String(item.id) === String(this.productFilters.categoryId)
          );

          if (category) parts.push(`categoria ${category.name}`);
        }
        if (this.productFilters.stockStatus !== "ALL") {
          const labels = { OK: "estoque saudavel", LOW: "abaixo do minimo", OUT: "zerado" };
          parts.push(labels[this.productFilters.stockStatus]);
        }
        if (this.productFilters.withoutCategory) parts.push("sem categoria");

        return parts.length ? `Filtrando por: ${parts.join(" · ")}` : "Sem filtros aplicados";
      },

      productRangeLabel() {
        const { page, pageSize, total } = this.productReport.pagination;
        const first = (page - 1) * pageSize + 1;
        const last = Math.min(page * pageSize, total);

        return `${first}-${last}`;
      },
    },

    watch: {
      // Cada filtro que muda volta para a pagina 1: continuar na
      // pagina 7 depois de trocar o filtro quase sempre da lista vazia.
      "productFilters.search"() {
        this.debouncedProductSearch();
      },
      "productFilters.categoryId"() {
        this.resetAndLoadProducts();
      },
      "productFilters.stockStatus"() {
        this.resetAndLoadProducts();
      },
      "productFilters.withoutCategory"() {
        this.resetAndLoadProducts();
      },
      "movementFilters.categoryId"() {
        this.resetAndLoadMovements();
      },
      "movementFilters.type"() {
        this.resetAndLoadMovements();
      },
      "movementFilters.startDate"() {
        this.resetAndLoadMovements();
      },
      "movementFilters.endDate"() {
        this.resetAndLoadMovements();
      },
    },

    async mounted() {
      await Promise.all([this.loadCategories(), this.loadSummary()]);
      await this.loadProducts();
    },

    methods: {
      // ---------- formatacao ----------
      money(value) {
        return currency.format(Number(value ?? 0));
      },

      dateTime(value) {
        return formatDateTime(value);
      },

      monthLabel(period) {
        const [year, month] = period.split("-");
        const names = [
          "jan", "fev", "mar", "abr", "mai", "jun",
          "jul", "ago", "set", "out", "nov", "dez",
        ];

        return `${names[Number(month) - 1]}/${year}`;
      },

      statusClass(status) {
        const classes = {
          OUT: "bg-rose-100 text-rose-700",
          LOW: "bg-amber-100 text-amber-700",
          OK: "bg-emerald-100 text-emerald-700",
        };

        return classes[status] ?? "bg-slate-100 text-slate-700";
      },

      abcClass(value) {
        const classes = {
          A: "bg-emerald-100 text-emerald-700",
          B: "bg-amber-100 text-amber-700",
          C: "bg-slate-100 text-slate-600",
        };

        return classes[value] ?? "bg-slate-100 text-slate-600";
      },

      // ---------- navegacao ----------
      changeTab(tabId) {
        this.activeTab = tabId;

        // Carrega sob demanda: a aba que ninguem abriu nao consulta a API.
        if (tabId === "movements" && this.movementReport.rows.length === 0) {
          this.loadMovements();
        }

        if (tabId === "summaries" && this.stockByCategory.length === 0) {
          this.loadSummaries();
        }

        if (tabId === "analysis" && this.abcCurve.length === 0) {
          this.loadAnalysis();
        }
      },

      // ---------- carregamento ----------
      async loadCategories() {
        try {
          this.categories = await api.listCategories();
        } catch (error) {
          this.errors.products = error.message;
        }
      },

      async loadSummary() {
        try {
          this.summary = await api.reportStockSummary();
        } catch (error) {
          this.errors.products = error.message;
        }
      },

      async loadProducts() {
        this.loading.products = true;
        this.errors.products = "";

        try {
          this.productReport = await api.reportProducts(this.productQuery);
        } catch (error) {
          this.errors.products = error.message;
          this.productReport = EMPTY_PRODUCT_REPORT;
        } finally {
          this.loading.products = false;
        }
      },

      async loadMovements() {
        this.loading.movements = true;
        this.errors.movements = "";

        try {
          this.movementReport = await api.reportMovements(this.movementQuery);
        } catch (error) {
          this.errors.movements = error.message;
          this.movementReport = EMPTY_MOVEMENT_REPORT;
        } finally {
          this.loading.movements = false;
        }
      },

      async loadSummaries() {
        this.loading.summaries = true;
        this.errors.summaries = "";

        try {
          const [byCategory, byUser, byMonth] = await Promise.all([
            api.reportStockByCategory(),
            api.reportMovementsByUser({}),
            api.reportMovementsByMonth({}),
          ]);

          this.stockByCategory = byCategory;
          this.movementsByUser = byUser;
          this.movementsByMonth = byMonth;
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
          const [top, parked, abc] = await Promise.all([
            api.reportTopProducts({ limit: 10 }),
            api.reportProductsWithoutMovement(),
            api.reportAbcCurve(),
          ]);

          this.topProducts = top;
          this.productsWithoutMovement = parked;
          this.abcCurve = abc;
        } catch (error) {
          this.errors.analysis = error.message;
        } finally {
          this.loading.analysis = false;
        }
      },

      // ---------- filtros ----------
      debouncedProductSearch() {
        clearTimeout(this.searchTimer);

        this.searchTimer = setTimeout(() => {
          this.resetAndLoadProducts();
        }, SEARCH_DEBOUNCE_MS);
      },

      resetAndLoadProducts() {
        this.productFilters.page = 1;
        this.loadProducts();
      },

      resetAndLoadMovements() {
        this.movementFilters.page = 1;
        this.loadMovements();
      },

      clearProductFilters() {
        this.productFilters = defaultProductFilters();
        this.loadProducts();
      },

      clearMovementFilters() {
        this.movementFilters = defaultMovementFilters();
        this.loadMovements();
      },

      sortProducts(key) {
        // Clicar na coluna que ja ordena inverte a direcao.
        if (this.productFilters.sort === key) {
          this.productFilters.direction =
            this.productFilters.direction === "asc" ? "desc" : "asc";
        } else {
          this.productFilters.sort = key;
          this.productFilters.direction = "asc";
        }

        this.resetAndLoadProducts();
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

      // ---------- exportacao ----------
      async exportProducts() {
        try {
          await downloadReport("/reports/products", this.productQuery, "relatorio-produtos.csv");
        } catch (error) {
          this.errors.products = error.message;
        }
      },

      async exportMovements() {
        try {
          await downloadReport(
            "/reports/movements",
            this.movementQuery,
            "relatorio-movimentacoes.csv"
          );
        } catch (error) {
          this.errors.movements = error.message;
        }
      },
    },
  }).mount("#app");
}
