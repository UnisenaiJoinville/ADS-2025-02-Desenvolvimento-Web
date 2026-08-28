# Estagio 1: build - compila o TypeScript, inclui devDependencies
FROM node:22-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY tsconfig.json ./
COPY src ./src
RUN npm run build

# Estagio 2: runtime - so o resultado compilado, sem devDependencies nem fonte TS
FROM node:22-alpine AS runtime
WORKDIR /app
COPY --from=build /app/dist ./dist
CMD ["node", "dist/index.js"]
