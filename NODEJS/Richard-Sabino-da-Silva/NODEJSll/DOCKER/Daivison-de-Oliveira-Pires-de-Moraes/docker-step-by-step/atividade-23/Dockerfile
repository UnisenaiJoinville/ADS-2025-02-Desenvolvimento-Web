# Atividade 23: Dockerfile multi-stage

# Estagio 1: build da aplicacao
FROM node:20 AS build
WORKDIR /app
COPY . .
RUN npm install && npm run build

# Estagio 2: imagem final, apenas com o resultado do build
FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
