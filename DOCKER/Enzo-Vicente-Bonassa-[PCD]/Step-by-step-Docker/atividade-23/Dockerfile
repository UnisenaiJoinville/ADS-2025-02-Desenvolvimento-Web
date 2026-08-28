FROM alpine:3.21 AS builder
WORKDIR /build
COPY site/index.html .
RUN mkdir -p /saida && cp index.html /saida/index.html

FROM nginx:alpine
COPY --from=builder /saida/index.html /usr/share/nginx/html/index.html
EXPOSE 80
