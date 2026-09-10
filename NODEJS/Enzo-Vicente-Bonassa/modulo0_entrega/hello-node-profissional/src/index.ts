import dayjs from 'dayjs';

function mensagemAmbiente(nome: string): string {
  const agora = dayjs().format('DD/MM/YYYY HH:mm:ss');
  return `Olá, ${nome}! Ambiente OK, ${process.version}. Execução: ${agora}`;
}

console.log(mensagemAmbiente('Node.js'));
