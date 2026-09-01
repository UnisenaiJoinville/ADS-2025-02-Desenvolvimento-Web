# Multi-stage: o Node so existe para compilar; a imagem final e so Nginx + estaticos.
FROM node:22-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

FROM nginx:1.27-alpine
COPY --from=build /app/dist /usr/share/nginx/html
# expose apenas documenta a porta; nao publica nada no host.
EXPOSE 80
