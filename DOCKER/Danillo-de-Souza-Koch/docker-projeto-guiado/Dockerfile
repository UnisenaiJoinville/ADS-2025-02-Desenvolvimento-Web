# Estágio 1: build
FROM node:22-alpine AS builder
WORKDIR /app

COPY backend/package*.json ./backend/
RUN npm install --prefix ./backend

COPY backend ./backend

# Estágio 2: runtime
FROM node:22-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production

COPY --from=builder /app/backend/package*.json ./backend/
COPY --from=builder /app/backend/node_modules ./backend/node_modules
COPY --from=builder /app/backend/server.js ./backend/server.js

EXPOSE 3000
CMD ["node", "/app/backend/server.js"]
