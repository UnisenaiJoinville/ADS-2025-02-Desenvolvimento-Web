import { requireAuth, getToken } from "./auth.js";
import { downloadReport } from "./api.js";
import { mountLayout, escapeHtml, setButtonLoading, toast } from "./layout.js";
import axios from "/vendor/axios.js";
mountLayout("/relatorios.html");
requireAuth();
const form = document.querySelector("[data-analysis]"),
  result = document.querySelector("[data-analysis-result]"),
  status = document.querySelector("[data-analysis-status]");
form.addEventListener("submit", async (event) => {
  event.preventDefault();
  const button = form.querySelector("button");
  if (button.disabled) return;
  setButtonLoading(button, true);
  try {
    const params = Object.fromEntries(new FormData(form)),
      report = params.report;
    delete params.report;
    for (const k of Object.keys(params)) if (!params[k]) delete params[k];
    const { data } = await axios.get("/api/reports/" + report, {
      params,
      headers: { Authorization: "Bearer " + getToken() },
    });
    const rows = Array.isArray(data)
      ? data
      : [
          {
            indicador: "Entradas",
            periodoA: data.periodA.unitsIn,
            periodoB: data.periodB.unitsIn,
            variacaoPercentual: data.variationPercent.unitsIn,
          },
          {
            indicador: "Saidas",
            periodoA: data.periodA.unitsOut,
            periodoB: data.periodB.unitsOut,
            variacaoPercentual: data.variationPercent.unitsOut,
          },
        ];
    if (!rows.length) {
      result.textContent = "Nenhum registro encontrado";
      return;
    }
    const keys = Object.keys(rows[0]);
    result.innerHTML =
      '<table class="w-full text-sm"><thead><tr>' +
      keys
        .map((k) => `<th class="border-b p-3 text-left">${escapeHtml(k)}</th>`)
        .join("") +
      "</tr></thead><tbody>" +
      rows
        .map(
          (row) =>
            "<tr>" +
            keys
              .map(
                (k) =>
                  `<td class="border-b p-3">${escapeHtml(row[k] ?? "Sem estimativa")}</td>`,
              )
              .join("") +
            "</tr>",
        )
        .join("") +
      "</tbody></table>";
    status.textContent = rows.length + " registro(s)";
  } catch (e) {
    status.textContent = e.response?.data?.error ?? e.message;
  } finally {
    setButtonLoading(button, false);
  }
});
document
  .querySelector("[data-user-csv]")
  .addEventListener("click", async () => {
    try {
      await downloadReport(
        "/reports/movements-by-user",
        {
          startDate: form.elements.startDate.value,
          endDate: form.elements.endDate.value,
        },
        "movimentacoes-por-usuario.csv",
      );
    } catch (e) {
      toast(e.message, "error");
    }
  });
