# Atividade 6 - Criando uma imagem Docker
# Imagem base: Ubuntu. Instala o utilitario 'curl' na etapa de build.
FROM ubuntu
RUN apt-get update && apt-get install -y curl

# Atividade 17 - Atualizando a imagem: novo pacote 'jq' em uma camada separada,
# para que a camada do 'curl' acima seja reaproveitada do cache.
RUN apt-get update && apt-get install -y jq
