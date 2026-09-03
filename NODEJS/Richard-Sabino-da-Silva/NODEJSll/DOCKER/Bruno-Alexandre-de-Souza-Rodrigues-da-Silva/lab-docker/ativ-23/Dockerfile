FROM node:24-alpine AS build
WORKDIR /app
RUN echo "console.log('app compilado')" > app.js

FROM node:24-alpine
WORKDIR /app
COPY --from=build /app/app.js .
CMD ["node", "app.js"]
