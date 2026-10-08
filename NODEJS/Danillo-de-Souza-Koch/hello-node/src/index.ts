import dayjs from "dayjs";

/**
 * Monta a mensagem de validação do ambiente profissional Node.js/TypeScript.
 *
 * @param nodeVersion - versão do Node.js em execução (process.version).
 * @param now - instante usado para formatar a data (facilita testes).
 * @returns mensagem pronta para ser exibida no console.
 */
export function buildStatusMessage(
  nodeVersion: string,
  now: Date = new Date(),
): string {
  const formattedDate = dayjs(now).format("DD/MM/YYYY [às] HH:mm:ss");
  return `Ambiente OK, ${nodeVersion} — validado em ${formattedDate}`;
}

function main(): void {
  const message = buildStatusMessage(process.version);
  console.log(message);
}

main();
