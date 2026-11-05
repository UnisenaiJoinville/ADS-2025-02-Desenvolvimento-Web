const SEPARATOR = ";";

const BOM = "﻿";

function escapeValue(value) {
  if (value === null || value === undefined) {
    return "";
  }

  const text = String(value);

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

  return BOM + [header, ...body].join("\r\n");
}

export function csvNumber(value, decimals = 2) {
  if (value === null || value === undefined) {
    return "";
  }

  return Number(value).toFixed(decimals).replace(".", ",");
}
