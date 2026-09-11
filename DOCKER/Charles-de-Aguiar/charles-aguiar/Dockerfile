FROM ubuntu
RUN apt-get update && apt-get install -y curl iputils-ping



FROM nginx:latest
COPY init.sh /init.sh
RUN chmod +x /init.sh
CMD ["/init.sh"]
