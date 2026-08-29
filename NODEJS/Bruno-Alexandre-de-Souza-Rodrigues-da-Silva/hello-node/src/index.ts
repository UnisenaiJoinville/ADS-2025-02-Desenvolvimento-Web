import { z } from 'zod';

const alunoSchema = z.object({
  nome: z.string().min(3),
  matricula: z.string().regex(/^\d{6}$/, 'a matricula tem 6 digitos'),
  curso: z.string(),
});

type Aluno = z.infer<typeof alunoSchema>;

function validarAluno(dados: unknown): Aluno {
  return alunoSchema.parse(dados);
}

function apresentar(aluno: Aluno): string {
  return `${aluno.nome} - ${aluno.curso} (matricula ${aluno.matricula})`;
}

console.log('Ambiente OK, ' + process.version);

const aluno = validarAluno({
  nome: 'Bruno Silva',
  matricula: '202601',
  curso: 'ADS',
});

console.log(apresentar(aluno));

// mostra o que acontece quando o dado esta errado
const resultado = alunoSchema.safeParse({
  nome: 'Br',
  matricula: '123',
  curso: 'ADS',
});

if (!resultado.success) {
  console.log('Dados invalidos:');
  for (const erro of resultado.error.issues) {
    console.log(`  ${erro.path.join('.')}: ${erro.message}`);
  }
}
