#atividade 17
#FROM ubuntu
   #RUN apt-get update && apt-get install -y curl wget

#atividade 23
FROM ubuntu AS builder
RUN apt-get update && apt-get install -y curl
RUN curl -o /arquivo.txt https://example.com

FROM ubuntu
COPY --from=builder /arquivo.txt /arquivo.txt
CMD ["cat", "/arquivo.txt"]   