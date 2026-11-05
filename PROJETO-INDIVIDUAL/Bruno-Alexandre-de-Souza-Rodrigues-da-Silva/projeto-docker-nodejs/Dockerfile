# Imagem base: Node.js 22 em uma distribuicao Alpine (leve)
FROM node:22-alpine

WORKDIR /app

# Copiamos primeiro os manifestos para aproveitar o cache de camadas
COPY package*.json ./

RUN npm install

COPY . .

EXPOSE 3000

CMD ["npm", "run", "dev"]
