FROM node:22-alpine

WORKDIR /app

# Copia so o manifesto primeiro: o cache do npm install so quebra se ele mudar.
COPY package*.json ./
RUN npm install --omit=dev

COPY . .

EXPOSE 3000
CMD ["node", "server.js"]
