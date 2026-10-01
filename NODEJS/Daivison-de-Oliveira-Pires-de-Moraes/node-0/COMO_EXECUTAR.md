# Como executar a atividade no VS Code

Fiz este passo a passo como se eu estivesse montando a atividade pela primeira vez. A ideia é entender o que cada comando faz, não só copiar e colar.

## 1. O que preciso ter instalado

Pelo material do Módulo 0, o ambiente usa:

- Node.js LTS
- npm
- Visual Studio Code
- Git
- GitHub
- Docker, para a validação em container

No Windows 11, o material apresenta o `nvm-windows` para controlar as versões do Node.js.

## 2. Conferir o Node.js

Abra o terminal do VS Code e execute:

```powershell
node -v
npm -v
```

Se os dois comandos mostrarem uma versão, o Node e o npm estão disponíveis.

## 3. Abrir a pasta

No VS Code:

1. Clique em **File > Open Folder**.
2. Escolha a pasta `node-0-atividade`.
3. Abra **Terminal > New Terminal**.

## 4. Instalar as dependências

Eu deixei tudo no `package.json`. Então não preciso instalar biblioteca por biblioteca.

Execute:

```bash
npm install
```

Isso cria a pasta `node_modules` e instala as dependências.

A principal dependência de execução é:

```text
dayjs
```

Ela é usada no `src/index.ts` para mostrar a data e hora.

## 5. Entender o TypeScript

O arquivo `tsconfig.json` tem:

```json
"strict": true
```

Isso significa que o TypeScript fica mais rigoroso com os tipos. Se eu escrever algo com um tipo incompatível, o compilador deve apontar o problema.

## 6. Executar o programa

O comando principal pedido na atividade é:

```bash
npx ts-node src/index.ts
```

O `npx` procura o executável instalado no projeto e o `ts-node` executa o arquivo TypeScript.

Também posso usar:

```bash
npm start
```

## 7. O que o programa faz

O arquivo `src/index.ts` faz três coisas simples:

1. Mostra uma mensagem dizendo que o ambiente está funcionando.
2. Mostra a versão do Node.js usando `process.version`.
3. Mostra data e hora usando o `dayjs`.

Não coloquei muita coisa porque a atividade é sobre preparar o ambiente e mostrar que ele está funcionando.

## 8. ESLint

O ESLint verifica problemas no código.

Execute:

```bash
npm run lint
```

Se não aparecer erro, o código passou pela verificação.

A configuração está no arquivo:

```text
eslint.config.js
```

## 9. Prettier

Para conferir a formatação:

```bash
npm run format:check
```

Para formatar:

```bash
npm run format
```

O arquivo `.prettierrc.json` guarda as regras de formatação.

## 10. EditorConfig

O `.editorconfig` ajuda a manter a mesma indentação e final de linha no projeto.

A regra principal usada aqui é:

```text
2 espaços
UTF-8
LF
```

## 11. Testar o Docker

O projeto também tem um `Dockerfile`, seguindo a ideia da seção de execução em container do módulo.

Primeiro:

```bash
docker build -t node-0-atividade .
```

Depois:

```bash
docker run --rm node-0-atividade
```

O código é o mesmo. A diferença é que agora ele roda dentro do container.

## 12. Git: primeiro commit

Antes, configure seu nome e e-mail, usando os seus dados:

```bash
git config --global user.name "SEU NOME"
git config --global user.email "SEU EMAIL"
```

Depois, dentro da pasta:

```bash
git init
git add .
git commit -m "chore: cria projeto inicial"
```

## 13. Segundo commit

Faça uma alteração pequena, por exemplo, melhore uma mensagem do `src/index.ts`.

Depois:

```bash
git add .
git commit -m "feat: adiciona informacoes do ambiente"
```

## 14. Terceiro commit

Agora faça outra melhoria pequena, como atualizar o README ou a configuração de qualidade.

Depois:

```bash
git add .
git commit -m "docs: documenta execucao do projeto"
```

Assim o histórico mostra evolução em vez de um único commit com tudo pronto.

## 15. GitHub por SSH

Crie o repositório no GitHub.

Se ainda não tiver uma chave SSH, o material usa:

```bash
ssh-keygen -t ed25519 -C "seu-email@exemplo.com"
```

Depois:

```bash
ssh-add ~/.ssh/id_ed25519
```

Veja a chave pública:

```bash
cat ~/.ssh/id_ed25519.pub
```

No Windows PowerShell, se `cat` não funcionar, pode usar:

```powershell
Get-Content ~/.ssh/id_ed25519.pub
```

Cadastre a chave no GitHub em **Settings > SSH and GPG keys > New SSH key**.

Teste:

```bash
ssh -T git@github.com
```

## 16. Conectar o projeto ao GitHub

Use a URL SSH do seu próprio repositório:

```bash
git remote add origin git@github.com:SEU-USUARIO/node-0-atividade.git
```

Confira:

```bash
git remote -v
```

E envie:

```bash
git branch -M main
git push -u origin main
```

## 17. Checklist final

Antes de entregar, eu verificaria:

```bash
node -v
npm -v
npm install
npx ts-node src/index.ts
npm run lint
npm run format:check
git log --oneline
```

O último comando deve mostrar pelo menos três commits.

Depois eu conferiria no GitHub se o repositório está acessível e se os arquivos estão lá.

## Observação

Não incluí uma URL de GitHub pronta porque cada aluno precisa usar a própria conta e o próprio repositório. Também não inventei prints de execução: o correto é executar os comandos no seu computador e, se o professor pedir, usar os seus próprios resultados.
