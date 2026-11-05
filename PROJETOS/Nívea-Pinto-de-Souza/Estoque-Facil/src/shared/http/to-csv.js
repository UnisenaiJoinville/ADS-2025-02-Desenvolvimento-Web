// Converte uma lista de objetos em texto CSV.
//
// CSV parece trivial ("e so separar por virgula") e nao e: basta um
// valor conter o separador, uma aspa ou uma quebra de linha para o
// arquivo inteiro sair torto. As tres regras abaixo resolvem isso.

// Excel em portugues espera PONTO E VIRGULA como separador, porque a
// virgula ja e o separador decimal. Com virgula, tudo cai numa coluna so.
const SEPARATOR = ";";

// BOM (Byte Order Mark): tres bytes invisiveis no inicio do arquivo
// que avisam ao Excel "isto e UTF-8". Sem ele, acentos viram simbolos.
const BOM = "﻿";

function escapeValue(value) {
  if (value === null || value === undefined) {
    return "";
  }

  const text = String(value);

  // Regra 1: campo com separador, aspas ou quebra de linha vai entre aspas.
  // Regra 2: aspa dentro do campo e escrita duas vezes.
  if (
    text.includes(SEPARATOR) ||
    text.includes('"') ||
    text.includes("\n") ||
    text.includes("\r")
  ) {
    return `"${text.replaceAll('"', '""')}"`;
  }

  return text;
}

/**
 * @param {object[]} rows    as linhas do relatorio
 * @param {{key: string, label: string, format?: Function}[]} columns
 *        quais colunas exportar, em qual ordem e com qual titulo
 */
export function toCsv(rows, columns) {
  const header = columns.map((column) => escapeValue(column.label)).join(SEPARATOR);

  const body = rows.map((row) =>
    columns
      .map((column) => {
        const value = column.format ? column.format(row[column.key], row) : row[column.key];

        return escapeValue(value);
      })
      .join(SEPARATOR)
  );

  // \r\n e o fim de linha previsto na especificacao do CSV (RFC 4180).
  return BOM + [header, ...body].join("\r\n");
}

// Numero no formato brasileiro: 1234.5 -> "1234,50"
export function csvNumber(value, decimals = 2) {
  if (value === null || value === undefined) {
    return "";
  }

  return Number(value).toFixed(decimals).replace(".", ",");
}
