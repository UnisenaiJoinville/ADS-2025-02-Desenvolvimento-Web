# Imagem base: Node.js 22 em uma distribuicao Alpine (leve)
FROM node:22-alpine

# Pasta de trabalho dentro do container
WORKDIR /app

# Copiamos primeiro os manifestos de dependencia.
# Assim o Docker reaproveita o cache quando so o codigo muda.
COPY package*.json ./

RUN npm install

# Agora copiamos o restante do projeto
COPY . .

EXPOSE 3000

CMD ["npm", "run", "dev"]
