FROM node:22-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run css:build
EXPOSE 3000
CMD ["npm", "run", "dev"]
