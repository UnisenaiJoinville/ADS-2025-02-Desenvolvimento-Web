# Aula 68 — Gráfico de movimentações no dashboard

⏱️ **Tempo estimado:** 55 minutos
📋 **Tipo:** prática (SQL + back-end + front-end)

---

## Objetivo

Acrescentar ao dashboard um gráfico de barras com as **entradas e saídas de cada dia**, com botões para escolher o período (7, 30 ou 90 dias):

```text
 +----------------------------------------------------------------+
 | Entradas x saidas por dia                [7 dias][30 dias][90 dias] |
 |                                                                |
 |  60 ┤        ▇                                                 |
 |  40 ┤   ▇    ▇ ▆          ▇                                    |
 |  20 ┤ ▇ ▇ ▃  ▇ ▆   ▂      ▇ ▅      ▇                           |
 |   0 ┼─┴─┴─┴──┴─┴───┴──────┴─┴──────┴──────────────────────     |
 |      21/09  24/09  27/09  30/09  03/10  06/10 ...              |
 |                  ■ Entradas   ■ Saidas                         |
 +----------------------------------------------------------------+
```

No caminho:

- uma **CTE recursiva** para gerar o calendário no SQL;
- `LEFT JOIN` para que dias **sem movimentação** apareçam com zero;
- a biblioteca **Chart.js**, e como atualizar um gráfico sem recriá-lo.

---

## Antes de começar

- [ ] [Aula 67](67-limite-tentativas-login.md) concluída
- [ ] Algumas movimentações em dias diferentes (os dados da [Aula 33](33-relatorios-mapa-do-banco.md) já têm)

---

## Arquivos desta aula

```text
ARQUIVOS ALTERADOS
├── src/modules/dashboard/dashboard-repository.js   (getDailyMovements)
├── src/modules/dashboard/dashboard-service.js      (getDailyMovements)
├── src/modules/dashboard/dashboard-controller.js   (movementsByDay)
├── src/modules/dashboard/dashboard-routes.js       (a rota)
├── public/js/api.js                                (getDailyMovements)
├── public/index.html                               (Chart.js + a secao)
└── public/js/dashboard.js                          (o grafico)
```

---

# PARTE 1 — O SQL

## 1. O problema dos dias vazios

A primeira ideia de consulta é agrupar as movimentações por dia:

```sql
SELECT DATE(created_at) AS dia,
       SUM(CASE WHEN type = 'IN'  THEN quantity ELSE 0 END) AS entradas,
       SUM(CASE WHEN type = 'OUT' THEN quantity ELSE 0 END) AS saidas
  FROM stock_movements
 WHERE created_at >= CURDATE() - INTERVAL 6 DAY
 GROUP BY DATE(created_at)
 ORDER BY dia;
```

Rode no terminal do banco e veja o resultado:

```text
dia          entradas  saidas
2026-10-14   50        0
2026-10-17   0         30
2026-10-20   15        2
```

Repare: os dias **15, 16, 18 e 19 sumiram**. Não houve movimentação neles, então não há linhas para agrupar. No gráfico, as barras de 14 e 17 ficariam **lado a lado**, como se fossem dias seguidos. A pessoa leria "movimentação todo dia", o que é falso.

> 📌 **`GROUP BY` só agrupa o que existe.** Para mostrar "zero", precisamos de uma lista com **todos** os dias, e então juntar as movimentações a ela. Isso tem nome: **LEFT JOIN com uma tabela de calendário** ([Aula 37](37-left-join.md)).

## 2. Gerando o calendário com uma CTE recursiva

Não existe uma tabela "dias" no banco. Vamos **gerá-la** na hora com uma CTE recursiva (MySQL 8+):

```sql
WITH RECURSIVE calendar AS (
  SELECT CURDATE() - INTERVAL 6 DAY AS day       -- 1. o primeiro dia
  UNION ALL
  SELECT day + INTERVAL 1 DAY                    -- 2. o dia seguinte...
    FROM calendar
   WHERE day < CURDATE()                         -- 3. ...ate chegar em hoje
)
SELECT day FROM calendar;
```

```text
day
2026-10-14
2026-10-15
2026-10-16
2026-10-17
2026-10-18
2026-10-19
2026-10-20
```

### Como ela funciona

Uma CTE (`WITH nome AS (...)`) é uma "tabela temporária com nome", que só existe durante a consulta. Você já viu subconsultas na [Aula 45](45-subqueries-e-relatorios-avancados.md); a CTE é uma subconsulta que ganha um nome e pode ser lida como tabela.

A versão **recursiva** se refere a si mesma:

```text
   âncora (roda 1 vez):         day = 14/10
   passo 1: 14/10 < 20/10?  sim -> day = 15/10
   passo 2: 15/10 < 20/10?  sim -> day = 16/10
   ...
   passo 6: 19/10 < 20/10?  sim -> day = 20/10
   passo 7: 20/10 < 20/10?  NAO -> para
```

| Parte | Papel |
|---|---|
| `SELECT CURDATE() - INTERVAL 6 DAY` | a **âncora**: a primeira linha |
| `UNION ALL` | junta a âncora com o que a recursão produzir |
| `SELECT day + INTERVAL 1 DAY FROM calendar` | o **passo**: cria a próxima linha a partir da anterior |
| `WHERE day < CURDATE()` | a **condição de parada** |

> ⚠️ **Sem a condição de parada, a recursão não acaba.** O MySQL se protege com o limite `cte_max_recursion_depth` (1000 por padrão) e devolve um erro. Para 90 dias, estamos muito longe dele.

> 🔍 **Por que `INTERVAL 6 DAY` para 7 dias?** Porque o intervalo inclui o dia de hoje: de 14 a 20 são **sete** dias. "Últimos N dias" = hoje menos `N - 1`.

## 3. Juntando calendário e movimentações

```sql
WITH RECURSIVE calendar AS (
  SELECT CURDATE() - INTERVAL 6 DAY AS day
  UNION ALL
  SELECT day + INTERVAL 1 DAY FROM calendar WHERE day < CURDATE()
)
SELECT DATE_FORMAT(c.day, '%Y-%m-%d') AS day,
       COALESCE(SUM(CASE WHEN m.type = 'IN'  THEN m.quantity END), 0) AS unitsIn,
       COALESCE(SUM(CASE WHEN m.type = 'OUT' THEN m.quantity END), 0) AS unitsOut
  FROM calendar c
  LEFT JOIN stock_movements m
    ON m.created_at >= c.day
   AND m.created_at <  c.day + INTERVAL 1 DAY
 GROUP BY c.day
 ORDER BY c.day;
```

```text
day          unitsIn  unitsOut
2026-10-14   50       0
2026-10-15   0        0         <- apareceu!
2026-10-16   0        0         <- apareceu!
2026-10-17   0        30
2026-10-18   0        0
2026-10-19   0        0
2026-10-20   15       2
```

### Linha por linha

| Trecho | Por quê |
|---|---|
| `FROM calendar c LEFT JOIN stock_movements m` | **todo** dia do calendário aparece, com ou sem movimentação |
| `m.created_at >= c.day AND m.created_at < c.day + INTERVAL 1 DAY` | "do começo deste dia até o começo do próximo" |
| `CASE WHEN m.type = 'IN' THEN m.quantity END` | sem `ELSE`: nos outros casos vale `NULL` |
| `COALESCE(SUM(...), 0)` | dia sem movimentação: o `SUM` de nada é `NULL`; viramos `0` |
| `GROUP BY c.day` | agrupa pelo dia **do calendário**, e não da movimentação |
| `DATE_FORMAT(c.day, '%Y-%m-%d')` | devolve o dia como **texto** (veja a seção 4) |

### 🔍 A armadilha da data com hora, de novo

Por que não `ON DATE(m.created_at) = c.day`? Funcionaria, mas é a armadilha da [Aula 41](41-relatorios-por-periodo.md):

| Condição | Usa o índice `idx_movements_created_at`? |
|---|---|
| `DATE(m.created_at) = c.day` | **não**: aplicar função na coluna impede o índice |
| `m.created_at >= c.day AND m.created_at < c.day + INTERVAL 1 DAY` | **sim**: compara a coluna "pura" |

Com 90 dias e milhares de movimentações, a diferença é grande.

### 🔍 Por que `LEFT` e não `INNER`?

Troque por `INNER JOIN` e rode: os dias vazios **somem de novo**. O `INNER` só mantém linhas com par nos dois lados. É exatamente o que vimos na Aula 37, agora num caso de uso de verdade.

## 4. Por que devolver a data como texto

Se devolvêssemos `c.day` (um `DATE`), o driver `mysql2` o transformaria num objeto `Date` do JavaScript, **à meia-noite no fuso do servidor**. Ao virar JSON, ele é convertido para UTC:

```text
   MySQL:  2026-10-14
   mysql2: Date(2026-10-14 00:00:00 -03:00)
   JSON:   "2026-10-14T03:00:00.000Z"
   front:  new Date(...) no navegador... e dependendo do fuso, "13/10"!
```

Com `DATE_FORMAT(..., '%Y-%m-%d')`, o banco devolve a **string** `"2026-10-14"`, que atravessa tudo sem conversão nenhuma.

> 📌 **Dia sem hora viaja como texto.** Só use `Date` quando houver hora de verdade.

---

# PARTE 2 — A API

## Passo 1 — O repositório

Abra `src/modules/dashboard/dashboard-repository.js` e acrescente no fim:

```javascript
// Entradas e saidas de cada dia dos ultimos N dias, SEM buracos (Aula 68).
// O calendario e gerado por uma CTE recursiva; o LEFT JOIN garante que
// os dias sem movimentacao aparecam com zero.
export async function getDailyMovements(days) {
  const [rows] = await pool.query(
    `WITH RECURSIVE calendar AS (
       SELECT CURDATE() - INTERVAL ? DAY AS day
       UNION ALL
       SELECT day + INTERVAL 1 DAY FROM calendar WHERE day < CURDATE()
     )
     SELECT DATE_FORMAT(c.day, '%Y-%m-%d') AS day,
            COALESCE(SUM(CASE WHEN m.type = 'IN'  THEN m.quantity END), 0) AS unitsIn,
            COALESCE(SUM(CASE WHEN m.type = 'OUT' THEN m.quantity END), 0) AS unitsOut
       FROM calendar c
       LEFT JOIN stock_movements m
         ON m.created_at >= c.day
        AND m.created_at <  c.day + INTERVAL 1 DAY
      GROUP BY c.day
      ORDER BY c.day`,
    // "ultimos 7 dias" = hoje e os 6 anteriores
    [days - 1]
  );

  return rows;
}
```

Salve.

## Passo 2 — O service

Abra `src/modules/dashboard/dashboard-service.js` e acrescente no fim:

```javascript
export async function getDailyMovements(days) {
  const rows = await repository.getDailyMovements(days);

  // SUM devolve DECIMAL, que o mysql2 entrega como texto: "12".
  return rows.map((row) => ({
    day: row.day,
    unitsIn: Number(row.unitsIn),
    unitsOut: Number(row.unitsOut),
  }));
}
```

Salve.

> 🔍 É a mesma conversão do `getDashboard` da [Aula 14](14-dashboard-api.md). O gráfico precisa de **números**: com `"12"` (texto), o Chart.js até desenharia, mas somas como `"12" + "3"` dariam `"123"`.

## Passo 3 — O controller

Abra `src/modules/dashboard/dashboard-controller.js` e deixe assim:

```javascript
import { AppError } from "../../shared/errors/app-error.js";

import * as service from "./dashboard-service.js";

// Lista branca de periodos (Aula 68). O grafico so oferece estes,
// e a API nao precisa aceitar outros.
const ALLOWED_DAYS = [7, 30, 90];

export async function index(request, response) {
  const dashboard = await service.getDashboard();

  response.json(dashboard);
}

export async function movementsByDay(request, response) {
  const days = request.query.days === undefined ? 30 : Number(request.query.days);

  if (!ALLOWED_DAYS.includes(days)) {
    throw new AppError(`O parametro days deve ser um destes: ${ALLOWED_DAYS.join(", ")}`);
  }

  const rows = await service.getDailyMovements(days);

  response.json(rows);
}
```

Salve.

> 🔍 **Lista branca em vez de "entre 1 e 365".** A tela só tem três botões. Aceitar só esses três valores é mais simples de validar e impede que alguém peça `?days=100000` e faça o banco gerar um calendário de 273 anos (que, aliás, estouraria o limite de recursão). É a ideia da lista branca de ordenação da [Aula 34](34-select-filtros-ordenacao.md).

## Passo 4 — A rota

Abra `src/modules/dashboard/dashboard-routes.js`:

```javascript
import { Router } from "express";

import { asyncHandler } from "../../shared/http/async-handler.js";

import * as controller from "./dashboard-controller.js";

export const dashboardRoutes = Router();

dashboardRoutes.get("/", asyncHandler(controller.index));
dashboardRoutes.get("/movements-by-day", asyncHandler(controller.movementsByDay));
```

Salve.

## Passo 5 — Testar a API

Com o `TOKEN` da Aula 62:

| # | Comando (com `-H "Authorization: Bearer $TOKEN"`) | Esperado |
|---|---|---|
| 1 | `curl -s "http://localhost:3000/api/dashboard/movements-by-day?days=7"` | **exatamente 7** objetos, de 6 dias atrás até hoje |
| 2 | `curl -s "http://localhost:3000/api/dashboard/movements-by-day"` | 30 objetos (o padrão) |
| 3 | `curl -s "http://localhost:3000/api/dashboard/movements-by-day?days=15"` | `400` — "deve ser um destes: 7, 30, 90" |
| 4 | `curl -s "http://localhost:3000/api/dashboard"` | o dashboard de sempre, sem mudança |

Confira no teste 1:

- [ ] os `day` são seguidos, sem pular nenhum
- [ ] o último `day` é **hoje**
- [ ] `unitsIn` e `unitsOut` são **números** (sem aspas)

## Passo 6 — O método no `api.js`

Abra `public/js/api.js` e, no grupo do dashboard:

```javascript
  // --- Dashboard ---
  getDashboard: () => http.get("/dashboard"),
  getDailyMovements: (days = 30) =>
    http.get("/dashboard/movements-by-day", { params: { days } }),
```

Salve.

---

# PARTE 3 — O gráfico

## 5. Por que Chart.js

| Opção | Prós | Contras |
|---|---|---|
| Desenhar com `<div>`s (como as barras por categoria da Aula 16) | zero dependência | eixos, legenda, dica ao passar o mouse... tudo na mão |
| **Chart.js** | gratuito, popular, responsivo, com dicas e legenda prontas | uma biblioteca a mais (~200 KB) |
| Bibliotecas maiores (D3, ECharts) | fazem qualquer coisa | curva de aprendizado muito maior |

Para um gráfico de barras com legenda e dica, o Chart.js é o ponto de equilíbrio.

O Chart.js desenha num **`<canvas>`**: uma área de pixels onde o JavaScript pinta. Diferente do SVG do Lucide, o conteúdo de um `<canvas>` **não** é HTML, e o leitor de tela não enxerga nada lá dentro. Vamos tratar isso.

## Passo 7 — O HTML

Abra `public/index.html`.

### 7.1 O Chart.js no `<head>`

Abaixo da linha do Lucide:

```html
    <script src="https://unpkg.com/lucide@0.469.0/dist/umd/lucide.min.js"></script>
    <!-- Graficos (Aula 68) -->
    <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.7/dist/chart.umd.js"></script>
```

### 7.2 A seção do gráfico

Logo **depois** da seção `data-month` (a das entradas/saídas do mês), acrescente:

```html
      <!-- Grafico: entradas e saidas por dia (Aula 68) -->
      <section class="mt-6 rounded-2xl border border-slate-200 bg-white p-6">
        <div class="mb-4 flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 class="text-lg font-semibold text-slate-900">Entradas x saidas por dia</h2>
            <p class="text-sm text-slate-500">Unidades movimentadas em cada dia do periodo</p>
          </div>

          <div class="flex gap-1 rounded-xl bg-slate-100 p-1" role="group" aria-label="Periodo do grafico">
            <button type="button" data-days="7" class="rounded-lg px-3 py-1.5 text-xs font-semibold">7 dias</button>
            <button type="button" data-days="30" class="rounded-lg px-3 py-1.5 text-xs font-semibold">30 dias</button>
            <button type="button" data-days="90" class="rounded-lg px-3 py-1.5 text-xs font-semibold">90 dias</button>
          </div>
        </div>

        <!-- O canvas precisa de um pai com altura definida (veja a secao 6) -->
        <div class="relative h-72">
          <canvas
            data-chart
            role="img"
            aria-label="Grafico de barras com as entradas e as saidas de cada dia"
          ></canvas>
        </div>

        <!-- Resumo em texto: o que o leitor de tela le no lugar do desenho -->
        <p data-chart-summary class="sr-only" aria-live="polite"></p>
      </section>
```

Salve.

> 🔍 **As abas 7/30/90** usam o mesmo visual das abas Todas/Entradas/Saídas de Movimentações ([Aula 18](18-front-movimentacoes.md)). Interfaces consistentes se aprendem uma vez só.

## Passo 8 — O JavaScript

Abra `public/js/dashboard.js`.

### 8.1 Referências e estado

Logo abaixo dos outros `document.querySelector` do topo, acrescente:

```javascript
// Grafico de entradas e saidas por dia (Aula 68)
const chartCanvas = document.querySelector("[data-chart]");
const chartSummary = document.querySelector("[data-chart-summary]");
const daysButtons = document.querySelectorAll("[data-days]");

let chart = null;     // a instancia do Chart.js (criada uma vez so)
let chartDays = 30;   // o periodo escolhido
```

### 8.2 As funções do gráfico

Acrescente **antes** da função `loadDashboard`:

```javascript
// ------------------------------------------------------------
// Grafico (Aula 68)
// ------------------------------------------------------------

// "2026-10-14" -> "14/10". Cortar o texto evita o new Date() e,
// com ele, qualquer chance de o fuso horario trocar o dia.
function formatDay(isoDay) {
  const [, month, day] = isoDay.split("-");

  return `${day}/${month}`;
}

function highlightDaysButtons() {
  daysButtons.forEach((button) => {
    const isActive = Number(button.dataset.days) === chartDays;

    button.setAttribute("aria-pressed", String(isActive));
    button.className = isActive
      ? "rounded-lg bg-white px-3 py-1.5 text-xs font-semibold text-slate-900 shadow-sm"
      : "rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800";
  });
}

function renderChart(rows) {
  // CDN fora do ar: o resto do dashboard continua funcionando.
  if (!window.Chart) {
    chartSummary.classList.remove("sr-only");
    chartSummary.textContent = "Nao foi possivel carregar o grafico.";
    return;
  }

  const labels = rows.map((row) => formatDay(row.day));
  const unitsIn = rows.map((row) => row.unitsIn);
  const unitsOut = rows.map((row) => row.unitsOut);

  if (chart) {
    // O grafico ja existe: so troca os dados e manda redesenhar.
    chart.data.labels = labels;
    chart.data.datasets[0].data = unitsIn;
    chart.data.datasets[1].data = unitsOut;
    chart.update();
  } else {
    chart = new Chart(chartCanvas, {
      type: "bar",
      data: {
        labels,
        datasets: [
          // As mesmas cores dos cards de entrada (emerald) e saida (rose).
          { label: "Entradas", data: unitsIn, backgroundColor: "#10b981", borderRadius: 4 },
          { label: "Saidas", data: unitsOut, backgroundColor: "#f43f5e", borderRadius: 4 },
        ],
      },
      options: {
        responsive: true,
        // Obedece a altura do <div class="h-72">, em vez de inventar uma.
        maintainAspectRatio: false,
        // Passar o mouse num dia mostra entradas E saidas daquele dia.
        interaction: { mode: "index", intersect: false },
        plugins: {
          legend: { position: "bottom" },
          tooltip: {
            callbacks: {
              label: (context) => `${context.dataset.label}: ${context.parsed.y} un.`,
            },
          },
        },
        scales: {
          x: {
            grid: { display: false },
            // Com 90 dias nao cabem 90 rotulos: o Chart.js pula alguns.
            ticks: { maxRotation: 0, autoSkip: true, maxTicksLimit: 10 },
          },
          y: {
            beginAtZero: true,
            // Unidades sao inteiras: nada de "2,5" no eixo.
            ticks: { precision: 0 },
          },
        },
      },
    });
  }

  const totalIn = unitsIn.reduce((sum, value) => sum + value, 0);
  const totalOut = unitsOut.reduce((sum, value) => sum + value, 0);

  chartSummary.textContent =
    `Nos ultimos ${rows.length} dias entraram ${totalIn} unidades e sairam ${totalOut}.`;
}

async function loadChart() {
  try {
    const rows = await api.getDailyMovements(chartDays);
    renderChart(rows);
  } catch (error) {
    toast(error.message, "error");
  }
}

daysButtons.forEach((button) => {
  button.addEventListener("click", () => {
    chartDays = Number(button.dataset.days);
    highlightDaysButtons();
    loadChart();
  });
});
```

### 8.3 O botão Atualizar e o início

Troque o listener do botão Atualizar:

```javascript
document.querySelector("[data-reload]").addEventListener("click", () => {
  loadDashboard();
  loadChart();
  toast("Dashboard atualizado", "info");
});
```

E o final do arquivo:

```javascript
// Porteiro da tela: requireAuth() manda para o login quando nao ha
// sessao e devolve false, entao nada aqui chega a ser carregado.
if (requireAuth()) {
  highlightDaysButtons();
  loadDashboard();
  loadChart();
}
```

Salve.

---

## 6. Dissecando o gráfico

### 6.1 Criar uma vez, atualizar depois

```javascript
if (chart) {
  chart.data.labels = labels;
  chart.data.datasets[0].data = unitsIn;
  chart.data.datasets[1].data = unitsOut;
  chart.update();
} else {
  chart = new Chart(chartCanvas, { ... });
}
```

E se a gente simplesmente criasse um gráfico novo a cada clique em "7 dias"?

```text
   Error: Canvas is already in use. Chart with ID '0' must be destroyed
   before the canvas with ID '' can be reused.
```

O Chart.js não deixa dois gráficos no mesmo `<canvas>`. Daria para destruir e recriar (`chart.destroy()`), mas **atualizar** é melhor:

| Recriar | Atualizar (`chart.update()`) |
|---|---|
| o gráfico some e reaparece | as barras **crescem/encolhem animadas** até o valor novo |
| refaz toda a configuração | só troca os números |

É o mesmo raciocínio do Vue: mudar o **dado** e deixar a biblioteca redesenhar.

### 6.2 `responsive` + `maintainAspectRatio: false` + pai com altura

```html
<div class="relative h-72">
  <canvas data-chart></canvas>
</div>
```

| Configuração | Efeito |
|---|---|
| `responsive: true` | o gráfico acompanha a **largura** do pai quando a janela muda |
| `maintainAspectRatio: false` | não força uma proporção: usa a **altura** do pai |
| `h-72` no pai | a altura fixa (288 px) que o gráfico vai ocupar |
| `relative` no pai | exigência do Chart.js para medir o pai corretamente |

> ⚠️ **O erro clássico:** `maintainAspectRatio: false` com um pai **sem altura**. O gráfico cresce sem parar, a página fica enorme, ou ele some (altura zero).

### 6.3 `interaction: { mode: "index" }`

Sem isso, passar o mouse sobre um dia mostra **só** a barra exata sob o cursor. Com `mode: "index"`, a dica mostra **todos** os valores daquela posição:

```text
   +------------------+
   | 14/10            |
   | Entradas: 50 un. |
   | Saidas: 0 un.    |
   +------------------+
```

### 6.4 Acessibilidade de um `<canvas>`

O `<canvas>` é uma imagem para o leitor de tela. Demos a ele duas camadas:

| O quê | Lido como |
|---|---|
| `role="img"` + `aria-label` | "Gráfico de barras com as entradas e as saídas de cada dia, imagem" |
| `<p class="sr-only" aria-live="polite">` | "Nos ultimos 30 dias entraram 213 unidades e sairam 67." (e é lido de novo quando o período muda) |

> 📌 **Todo gráfico precisa de uma alternativa em texto.** O resumo é também uma forma de "conferir" o gráfico durante os testes.

---

## Passo 9 — Testar

Recarregue com **Ctrl + Shift + R** e abra o Dashboard.

| # | Faça | Esperado |
|---|---|---|
| 1 | Abra a tela | Gráfico de 30 dias, aba "30 dias" destacada |
| 2 | Clique em "7 dias" | As barras **animam** até os novos valores; 7 rótulos no eixo |
| 3 | Clique em "90 dias" | Muitas barras finas; o eixo mostra só alguns rótulos |
| 4 | Passe o mouse sobre um dia | Dica com entradas **e** saídas daquele dia |
| 5 | Confira os dias sem movimentação | Aparecem no eixo, com barra zero |
| 6 | Movimentações: registre uma entrada de 25 | — |
| 7 | Volte ao Dashboard e clique em **Atualizar** | A barra verde de **hoje** subiu 25 |
| 8 | Diminua a janela | O gráfico acompanha a largura |
| 9 | Bloqueie a URL do Chart.js (F12 → Network → Block request URL) e recarregue | "Nao foi possivel carregar o grafico."; o resto do dashboard funciona |

### Confira o resumo para leitor de tela

No console:

```javascript
document.querySelector("[data-chart-summary]").textContent
```

✅ Deve mostrar o total de entradas e saídas do período, e mudar quando você troca a aba.

---

## ✅ Confira se deu certo

- [ ] A consulta devolve **um registro por dia**, inclusive os vazios
- [ ] O `day` chega como texto `"AAAA-MM-DD"`
- [ ] `unitsIn` e `unitsOut` chegam como números
- [ ] `?days=15` dá `400`
- [ ] O gráfico é criado **uma vez** e atualizado nas trocas de período
- [ ] As cores batem com os cards de entrada e saída
- [ ] O `<canvas>` tem `role="img"` e `aria-label`, e há um resumo em texto
- [ ] Sem o Chart.js, o dashboard continua funcionando

---

## 🔧 Se deu erro

### `ER_PARSE_ERROR` perto de `RECURSIVE`

O seu MySQL é anterior ao 8.0. Confira com `SELECT VERSION();`. O projeto usa `mysql:8.0` ([Aula 05](05-docker-compose.md)).

### `Recursive query aborted after 1001 iterations`

A condição de parada está errada (por exemplo, `day > CURDATE()` em vez de `<`), e a recursão não termina.

### Os dias vazios não aparecem

O `JOIN` está como `INNER`, ou o `FROM` começa por `stock_movements` em vez de `calendar`. O calendário precisa ser a tabela da **esquerda**.

### Os dias aparecem um a menos (o gráfico de 7 dias termina ontem)

Você está convertendo o `day` com `new Date(...)` no front. Use o `formatDay` que corta o texto.

### Um dia aparece com a entrada de outro dia

A condição do `ON` está com `<=` no fim: `m.created_at <= c.day + INTERVAL 1 DAY`. Uma movimentação exatamente à meia-noite contaria nos **dois** dias. O certo é `<`.

### `Chart is not defined`

Faltou o `<script>` do Chart.js no `<head>` do `index.html`, ou a URL está errada.

### `Canvas is already in use`

O código está criando um `new Chart(...)` a cada carga. Confira o `if (chart)` do `renderChart`.

### O gráfico fica gigante ou com altura zero

O `<div>` pai do `<canvas>` está sem a classe de altura (`h-72`) ou sem o `relative`.

---

## ➡️ Próximo passo

Falta a última melhoria: tirar o Tailwind do CDN em produção. E depois, o teste final de todo o bloco.

**[Aula 69 — Tailwind compilado e teste final do bloco](69-tailwind-producao-teste-final.md)**
