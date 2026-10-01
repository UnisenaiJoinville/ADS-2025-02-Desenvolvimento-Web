# Node 0 - Atividade

Este projeto é a minha resolução da atividade prática do Módulo 0 de Node.js. A ideia foi pegar o `hello-node` inicial e transformar em um projeto pequeno, organizado e com algumas ferramentas usadas em um projeto profissional.

O programa está em TypeScript e mostra uma mensagem confirmando que o ambiente está funcionando, a versão do Node.js e a data e hora atual. Para a data eu escolhi a biblioteca `dayjs` como dependência externa, porque é simples de usar e atende exatamente ao exemplo pedido na atividade.

Também deixei o TypeScript em modo estrito, configurei ESLint e Prettier e criei o `.editorconfig`. Assim o projeto não depende só das configurações do meu computador. Outra decisão foi usar CommonJS no `tsconfig.json`, porque o comando `npx ts-node src/index.ts` pedido na atividade funciona diretamente com essa configuração.

## Como executar

### 1. Abrir o projeto no VS Code

Abra a pasta `node-0-atividade` no VS Code.

### 2. Conferir o Node.js

No terminal do VS Code:

```bash
node -v
npm -v
```

### 3. Instalar as dependências

```bash
npm install
```

### 4. Executar

```bash
npx ts-node src/index.ts
```

Também deixei estes atalhos:

```bash
npm start
npm run dev
```

### 5. Verificar o código

```bash
npm run lint
npm run format:check
```

Para formatar os arquivos:

```bash
npm run format
```

## Git

A atividade pede pelo menos três commits mostrando a evolução do trabalho. O arquivo `COMO_EXECUTAR.md` mostra uma sequência simples para fazer isso e depois enviar o projeto para o GitHub por SSH.

## Estrutura

```text
node-0-atividade/
├── src/
│   └── index.ts
├── .editorconfig
├── .gitignore
├── .prettierrc.json
├── Dockerfile
├── eslint.config.js
├── package.json
├── tsconfig.json
├── ATIVIDADE-TEORICA.md
└── COMO_EXECUTAR.md
```
