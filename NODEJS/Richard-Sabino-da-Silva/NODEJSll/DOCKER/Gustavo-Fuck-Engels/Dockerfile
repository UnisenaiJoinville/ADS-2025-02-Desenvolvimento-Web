FROM ubuntu

RUN apt-get update && apt-get install -y bash

COPY init.sh /init.sh

RUN chmod +x /init.sh

CMD ["/init.sh"]