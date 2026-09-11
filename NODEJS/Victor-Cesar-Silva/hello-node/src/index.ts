import dayjs from 'dayjs';
import { z } from 'zod';

// Contrato de entrada validado em runtime pelo zod.
const alunoSchema = z.object({
  nome: z.string().min(3),
  modulo: z.number().int().min(0),
  matriculadoEm: z.string().date(),
});

// O tipo estatico vem do proprio schema - uma fonte de verdade so.
type Aluno = z.infer<typeof alunoSchema>;

// Formata a data com dayjs e calcula ha quantos dias houve a matricula.
function descreverMatricula(aluno: Aluno): string {
  const data = dayjs(aluno.matriculadoEm);
  const dias = dayjs().diff(data, 'day');
  return `${aluno.nome} | modulo ${aluno.modulo} | matriculado em ${data.format('DD/MM/YYYY')} (ha ${dias} dias)`;
}

function main(): void {
  const entrada: unknown = {
    nome: 'Victor Cesar Silva',
    modulo: 0,
    matriculadoEm: '2026-08-01',
  };

  // safeParse nao lanca excecao: devolve sucesso ou a lista de erros.
  const resultado = alunoSchema.safeParse(entrada);

  if (!resultado.success) {
    console.error('Dados invalidos:', resultado.error.issues);
    process.exitCode = 1;
    return;
  }

  console.log('Hello Node profissional!');
  console.log(descreverMatricula(resultado.data));
}

main();
