# Etapa 1: Compilação e Construção (Builder)
FROM node:20 AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Etapa 2: Execução Final (Produção)
FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]


# Copia o script para dentro do container
COPY init.sh /usr/local/bin/init.sh

# Garante que o arquivo tenha permissão de execução
RUN chmod +x /usr/local/bin/init.sh

# Define o script como o ENTRYPOINT do container
ENTRYPOINT ["/usr/local/bin/init.sh"]
