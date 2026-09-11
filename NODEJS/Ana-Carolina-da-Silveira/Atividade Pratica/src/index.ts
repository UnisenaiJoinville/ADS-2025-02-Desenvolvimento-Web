import dayjs from "dayjs";

function gerarSaudacao(nome: string): string {
  const agora = dayjs().format("DD/MM/YYYY HH:mm");
  return `Olá, ${nome}! Projeto executado em ${agora}.`;
}

console.log(gerarSaudacao("Aluno"));
