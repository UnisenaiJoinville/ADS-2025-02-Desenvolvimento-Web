FROM node:22-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY public ./public
COPY styles ./styles
COPY scripts/build-assets.js ./scripts/build-assets.js
COPY tailwind.config.js ./
RUN npm run build
FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production TZ=America/Sao_Paulo
COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force
COPY --chown=node:node src ./src
COPY --from=build --chown=node:node /app/public ./public
USER node
EXPOSE 3000
CMD ["node","src/server.js"]
