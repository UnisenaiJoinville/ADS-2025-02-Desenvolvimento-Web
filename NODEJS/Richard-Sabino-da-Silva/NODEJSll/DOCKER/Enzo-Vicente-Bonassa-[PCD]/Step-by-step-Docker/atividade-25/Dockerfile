FROM alpine:3.21
WORKDIR /app
COPY init.sh /app/init.sh
RUN chmod +x /app/init.sh
ENTRYPOINT ["/app/init.sh"]
