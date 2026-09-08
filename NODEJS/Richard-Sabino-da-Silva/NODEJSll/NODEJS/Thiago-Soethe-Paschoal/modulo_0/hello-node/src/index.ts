import dayjs from 'dayjs';

function mensagemAmbiente(nome: string): string {
  const agora = dayjs().format('DD/MM/YYYY HH:mm');
  return `Olá, ${nome}! Ambiente OK com ${process.version}. Data e hora: ${agora}`;
}

console.log(mensagemAmbiente('aluno'));
