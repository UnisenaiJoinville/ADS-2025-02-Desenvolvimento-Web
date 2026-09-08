# Atividade 23 - Dockerfile multi-stage
#
# Etapa 1 ("build"): imagem pesada, com o compilador C completo (~1.5 GB).
# Compila o binario estatico. Nada dessa etapa vai para a imagem final.
FROM gcc:14 AS build
WORKDIR /src
COPY hello.c .
RUN gcc -static -O2 -o /hello hello.c

# Etapa 2 (final): imagem minima. Copia SO o binario pronto da etapa "build".
# O resultado nao contem compilador, headers nem codigo-fonte.
FROM alpine:3.20
COPY --from=build /hello /usr/local/bin/hello
CMD ["hello"]
