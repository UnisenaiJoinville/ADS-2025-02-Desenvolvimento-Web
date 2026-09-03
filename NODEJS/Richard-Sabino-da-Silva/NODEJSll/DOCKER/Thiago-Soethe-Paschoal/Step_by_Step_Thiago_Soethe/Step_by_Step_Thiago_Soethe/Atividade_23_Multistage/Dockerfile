FROM alpine AS builder

RUN echo "Arquivo criado na etapa de build" > /resultado.txt


FROM alpine

COPY --from=builder /resultado.txt /resultado.txt

CMD ["cat", "/resultado.txt"]