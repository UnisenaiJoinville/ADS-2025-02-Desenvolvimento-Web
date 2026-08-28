# Atividade 25 - container com script de inicializacao
FROM alpine:3.20

# Copia o script e o torna executavel
COPY init.sh /usr/local/bin/init.sh
RUN chmod +x /usr/local/bin/init.sh

ENV APP_ENV=desenvolvimento
WORKDIR /app

# init.sh roda primeiro (setup) e no fim faz 'exec "$@"' para rodar o CMD
ENTRYPOINT ["/usr/local/bin/init.sh"]
CMD ["echo", "aplicacao principal em execucao"]
