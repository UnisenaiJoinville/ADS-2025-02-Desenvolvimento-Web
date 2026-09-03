# Módulo 0 — Ambiente Profissional

**Aluno:** Victor Cesar Silva

## Entregas

### 17.1 — Atividade teórica
[`atividade-teorica-victor-cesar-silva.md`](atividade-teorica-victor-cesar-silva.md)

Texto corrido com os 7 itens: event loop, síncrono vs. assíncrono, TypeScript,
CommonJS vs. ES Modules, comparação Express/Fastify/NestJS (com cenário real de uso para
cada), nvm e container vs. máquina virtual. Referências em ABNT.

### 17.2 — hello-node
[`hello-node/`](hello-node/)

| Requisito | Situação |
|---|---|
| `tsconfig.json` com `"strict": true` | ✅ mais `noUnusedLocals`, `noUnusedParameters`, `noImplicitReturns` |
| ESLint + Prettier como devDependencies | ✅ com `.editorconfig` na raiz |
| Dependência externa usada em `src/index.ts` | ✅ duas: `zod` e `dayjs` |
| README com 3+ parágrafos | ✅ o que faz, decisões técnicas, como rodar |

Como rodar:

```bash
cd hello-node
npm install
npm run build && npm start
npm run lint
```

Saída:

```
Hello Node profissional!
Victor Cesar Silva | modulo 0 | matriculado em 01/08/2026 (ha 27 dias)
```

### Complemento
[`ssh-github-passo-a-passo.md`](ssh-github-passo-a-passo.md) — geração da chave ed25519,
ssh-agent, cadastro no GitHub e teste da conexão.
