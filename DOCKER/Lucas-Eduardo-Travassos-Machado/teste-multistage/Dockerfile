FROM node:18 AS build
WORKDIR /app
RUN echo "build stage"

FROM node:18-alpine
WORKDIR /app
COPY --from=build /app .
CMD ["node", "-e", "console.log('multi-stage ok')"]
