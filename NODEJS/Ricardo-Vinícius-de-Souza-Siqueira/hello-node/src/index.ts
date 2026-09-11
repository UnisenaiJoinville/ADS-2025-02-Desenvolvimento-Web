import dayjs from 'dayjs';

function formatBoasVindas(nomeAmbiente: string, versaoNode: string): string {
  const dataFormatada = dayjs().format('DD/MM/YYYY HH:mm');
  return `Ambiente OK, ${versaoNode} (${nomeAmbiente}) - iniciado em ${dataFormatada}`;
}

console.log(formatBoasVindas('hello-node', process.version));
