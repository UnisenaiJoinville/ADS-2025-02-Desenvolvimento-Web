import { z } from "zod";

const UsuarioSchema = z.object({
  nome: z.string().min(2),
  idade: z.number().int().positive()
});

function apresentarUsuario(entrada: unknown): string {
  const usuario = UsuarioSchema.parse(entrada);
  return `${usuario.nome} possui ${usuario.idade} anos.`;
}

console.log(apresentarUsuario({ nome: "Aluno", idade: 21 }));
