FROM node:22-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install --omit=dev

COPY . .

# Worker nao expoe porta: ele so consome a fila.
CMD ["node", "worker.js"]
