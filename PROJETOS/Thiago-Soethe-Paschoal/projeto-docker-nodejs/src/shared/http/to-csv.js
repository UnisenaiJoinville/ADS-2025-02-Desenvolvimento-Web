const SEPARATOR=";"; const BOM="﻿";
function escapeValue(value){if(value===null||value===undefined)return "";const text=String(value);return text.includes(SEPARATOR)||text.includes('"')||text.includes("\n")||text.includes("\r")?`"${text.replaceAll('"','""')}"`:text;}
export function toCsv(rows,columns){const header=columns.map(c=>escapeValue(c.label)).join(SEPARATOR);const body=rows.map(row=>columns.map(c=>escapeValue(c.format?c.format(row[c.key],row):row[c.key])).join(SEPARATOR));return BOM+[header,...body].join("\r\n");}
export function csvNumber(value,decimals=2){return value===null||value===undefined?"":Number(value).toFixed(decimals).replace(".",",");}
