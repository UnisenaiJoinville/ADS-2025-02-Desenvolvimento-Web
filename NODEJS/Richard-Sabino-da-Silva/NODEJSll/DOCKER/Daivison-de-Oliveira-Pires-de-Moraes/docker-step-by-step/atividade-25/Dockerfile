# Atividade 25: container com script de inicializacao
FROM ubuntu

COPY init.sh /init.sh
RUN chmod +x /init.sh

ENTRYPOINT ["/init.sh"]
CMD ["bash"]
