# Evidencia de execucao - Atividade 25: Criando um container com script de inicialização

Gerado em: 2026-08-28 14:25:09 -0300

## Comandos e saída

```
$ cat init.sh
#!/bin/sh
echo "Iniciando container..."
echo "Data/hora do host do container: $(date)"
echo "Usuario atual: $(whoami)"
echo "Ambiente inicializado com sucesso."

$ cat Dockerfile
FROM alpine:3.20
WORKDIR /app
COPY init.sh .
RUN chmod +x init.sh
CMD ["./init.sh"]

$ docker build -t hello-init .
#0 building with "desktop-linux" instance using docker driver

#1 [internal] load build definition from Dockerfile
#1 transferring dockerfile: 121B 0.0s done
#1 DONE 0.1s

#2 [internal] load metadata for docker.io/library/alpine:3.20
#2 ...

#3 [auth] library/alpine:pull token for registry-1.docker.io
#3 DONE 0.0s

#2 [internal] load metadata for docker.io/library/alpine:3.20
#2 DONE 1.7s

#4 [internal] load .dockerignore
#4 transferring context: 2B done
#4 DONE 0.0s

#5 [internal] load build context
#5 DONE 0.0s

#6 [1/4] FROM docker.io/library/alpine:3.20@sha256:d9e853e87e55526f6b2917df91a2115c36dd7c696a35be12163d44e6e2a4b6bc
#6 resolve docker.io/library/alpine:3.20@sha256:d9e853e87e55526f6b2917df91a2115c36dd7c696a35be12163d44e6e2a4b6bc
#6 ...

#5 [internal] load build context
#5 transferring context: 197B done
#5 DONE 0.1s

#6 [1/4] FROM docker.io/library/alpine:3.20@sha256:d9e853e87e55526f6b2917df91a2115c36dd7c696a35be12163d44e6e2a4b6bc
#6 resolve docker.io/library/alpine:3.20@sha256:d9e853e87e55526f6b2917df91a2115c36dd7c696a35be12163d44e6e2a4b6bc 0.0s done
#6 sha256:25f1d6b1951ac8eb3740558fe94cb83d377bdadf95fd9f98b50d2e1b96130471 0B / 3.63MB 0.2s
#6 sha256:25f1d6b1951ac8eb3740558fe94cb83d377bdadf95fd9f98b50d2e1b96130471 1.05MB / 3.63MB 0.3s
#6 sha256:25f1d6b1951ac8eb3740558fe94cb83d377bdadf95fd9f98b50d2e1b96130471 3.15MB / 3.63MB 0.5s
#6 sha256:25f1d6b1951ac8eb3740558fe94cb83d377bdadf95fd9f98b50d2e1b96130471 3.63MB / 3.63MB 0.5s done
#6 extracting sha256:25f1d6b1951ac8eb3740558fe94cb83d377bdadf95fd9f98b50d2e1b96130471
#6 extracting sha256:25f1d6b1951ac8eb3740558fe94cb83d377bdadf95fd9f98b50d2e1b96130471 0.2s done
#6 DONE 0.8s

#7 [2/4] WORKDIR /app
#7 DONE 0.2s

#8 [3/4] COPY init.sh .
#8 DONE 0.1s

#9 [4/4] RUN chmod +x init.sh
#9 DONE 0.3s

#10 exporting to image
#10 exporting layers
#10 exporting layers 0.4s done
#10 exporting manifest sha256:8c0aeba5ea7987e68310d0aa2eddd4056331946dfc983c85ea81c06fa2491d92 0.0s done
#10 exporting config sha256:277c1450bcdb34528716e1b31142346b7f2475eac5334708932e10687bf6aa30 0.0s done
#10 exporting attestation manifest sha256:2f9fa7e60ccfdcc8ed7e2ed4eeb457c534125ac2de18630871e10b0e2aa325f4 0.1s done
#10 exporting manifest list sha256:af5b85bc331b9ea68c16f70059ce188be1056fd61c8759e8b48aa24aa3dd95a9
#10 exporting manifest list sha256:af5b85bc331b9ea68c16f70059ce188be1056fd61c8759e8b48aa24aa3dd95a9 0.1s done
#10 naming to docker.io/library/hello-init:latest done
#10 unpacking to docker.io/library/hello-init:latest 0.1s done
#10 DONE 0.7s

$ docker run --rm hello-init
Iniciando container...
Data/hora do host do container: Fri Aug 28 17:25:15 UTC 2026
Usuario atual: root
Ambiente inicializado com sucesso.

```

