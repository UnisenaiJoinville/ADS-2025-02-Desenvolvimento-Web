#FROM ubuntu:latest

#RUN apt-get update && apt-get install -y curl wget

#-----------------------------------------------------------------------------------------
#FROM ubuntu:latest AS etapa1

##RUN apt-get update && apt-get install -y curl

#RUN echo "Arquivo criado na primeira etapa" > /arquivo.txt

#FROM ubuntu:latest

#COPY --from=etapa1 /arquivo.txt /arquivo.txt

#CMD ["cat", "/arquivo.txt"]

FROM ubuntu:latest

COPY init.sh /init.sh

RUN chmod +x /init.sh

CMD ["/init.sh"]