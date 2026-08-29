# hello-node

Projeto da atividade prática do Módulo 0 (seção 17.2), do curso de Node.js
profissional da UniSENAI.

**Aluno:** Bruno Silva

---

## O que o projeto faz

O projeto é pequeno de propósito: ele existe para provar que o ambiente de
desenvolvimento está montado corretamente, não para resolver um problema de
negócio. Quando executado, ele imprime a versão do Node.js que está rodando,
valida um objeto que representa um aluno (nome, matrícula e curso) e mostra o
resultado formatado no terminal. Em seguida, ele tenta validar um segundo
objeto propositalmente errado, com nome curto demais e matrícula com número
errado de dígitos, só para mostrar as mensagens de erro que a validação gera.

## Decisões técnicas

A biblioteca escolhida foi a **zod**. O material apresenta ela na seção 14.3 e
eu preferi ela em vez de uma biblioteca de datas como a `dayjs` por um motivo
específico: a zod resolve validação e tipagem ao mesmo tempo. Eu declaro o
schema uma única vez e o TypeScript deriva o tipo `Aluno` a partir dele com
`z.infer`. Se eu tivesse escrito uma `interface` na mão e uma validação
separada, as duas poderiam sair de sincronia quando o projeto crescesse — eu
mudaria uma e esqueceria a outra. Com a zod isso não acontece, porque só existe
uma fonte de verdade.

O `tsconfig.json` está com `"strict": true`, como a atividade exige. Ligar o
modo estrito quebrou a compilação na primeira tentativa: o TypeScript reclamou
que não conhecia o `process` do Node. A correção foi adicionar `"types": ["node"]`
no `tsconfig.json`, já que o pacote `@types/node` estava instalado mas não
estava sendo carregado. O ESLint e o Prettier entraram como devDependencies e
não apenas como extensão do editor, porque assim a regra vale para qualquer
pessoa que clonar o repositório, independente do editor que ela usar. O
`.editorconfig` segue o modelo da seção 12 do material.

---

## Como rodar

Requisitos: Node.js LTS instalado.

```bash
npm install
npm run dev
```

Saída esperada:

```
Ambiente OK, v22.21.0
Bruno Silva - ADS (matricula 202601)
Dados invalidos:
  nome: Too small: expected string to have >=3 characters
  matricula: a matricula tem 6 digitos
```

## Outros comandos

```bash
npm run lint      # verifica o codigo com ESLint
npm run format    # formata com Prettier
npm run build     # compila para a pasta dist
```
