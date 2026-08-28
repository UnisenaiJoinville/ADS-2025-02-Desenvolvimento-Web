# Evidencia de execucao - Atividade 23: Usando Dockerfile multi-stage

Gerado em: 2026-08-28 14:24:44 -0300

## Comandos e saída

```
$ cat Dockerfile
# Estagio 1: build - compila o TypeScript, inclui devDependencies
FROM node:22-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY tsconfig.json ./
COPY src ./src
RUN npm run build

# Estagio 2: runtime - so o resultado compilado, sem devDependencies nem fonte TS
FROM node:22-alpine AS runtime
WORKDIR /app
COPY --from=build /app/dist ./dist
CMD ["node", "dist/index.js"]

$ docker build -t hello-multistage .
#0 building with "desktop-linux" instance using docker driver

#1 [internal] load build definition from Dockerfile
#1 transferring dockerfile: 432B 0.0s done
#1 DONE 0.1s

#2 [internal] load metadata for docker.io/library/node:22-alpine
#2 ...

#3 [auth] library/node:pull token for registry-1.docker.io
#3 DONE 0.0s

#2 [internal] load metadata for docker.io/library/node:22-alpine
#2 DONE 1.8s

#4 [internal] load .dockerignore
#4 transferring context: 2B done
#4 DONE 0.1s

#5 [internal] load build context
#5 DONE 0.0s

#6 [build 1/7] FROM docker.io/library/node:22-alpine@sha256:c610fcdfb1d5b4740dd70c284ed3cb16bb857e0f7166196e36a5501df7a3aa32
#6 resolve docker.io/library/node:22-alpine@sha256:c610fcdfb1d5b4740dd70c284ed3cb16bb857e0f7166196e36a5501df7a3aa32 0.0s done
#6 ...

#5 [internal] load build context
#5 transferring context: 568B 0.0s done
#5 DONE 0.1s

#6 [build 1/7] FROM docker.io/library/node:22-alpine@sha256:c610fcdfb1d5b4740dd70c284ed3cb16bb857e0f7166196e36a5501df7a3aa32
#6 sha256:16da5a6403776464b5bf551ef294de57da242eac594527ea551a46e7f76ac2d6 0B / 445B 0.2s
#6 sha256:16da5a6403776464b5bf551ef294de57da242eac594527ea551a46e7f76ac2d6 445B / 445B 0.2s done
#6 sha256:a2980c1fee17dfd6263234b253955e0e9d5f38d47c0e71c001139897134899d0 0B / 1.26MB 0.3s
#6 sha256:efbef6f9e333972a10ca323e700496a64e7ddcc3a6725e6afbbae52e690f4a4a 0B / 52.63MB 0.2s
#6 sha256:a2980c1fee17dfd6263234b253955e0e9d5f38d47c0e71c001139897134899d0 1.26MB / 1.26MB 0.5s
#6 sha256:a2980c1fee17dfd6263234b253955e0e9d5f38d47c0e71c001139897134899d0 1.26MB / 1.26MB 0.5s done
#6 sha256:efbef6f9e333972a10ca323e700496a64e7ddcc3a6725e6afbbae52e690f4a4a 4.19MB / 52.63MB 0.8s
#6 sha256:efbef6f9e333972a10ca323e700496a64e7ddcc3a6725e6afbbae52e690f4a4a 8.39MB / 52.63MB 1.1s
#6 sha256:efbef6f9e333972a10ca323e700496a64e7ddcc3a6725e6afbbae52e690f4a4a 12.58MB / 52.63MB 1.4s
#6 sha256:efbef6f9e333972a10ca323e700496a64e7ddcc3a6725e6afbbae52e690f4a4a 17.83MB / 52.63MB 1.7s
#6 sha256:efbef6f9e333972a10ca323e700496a64e7ddcc3a6725e6afbbae52e690f4a4a 20.97MB / 52.63MB 2.0s
#6 sha256:efbef6f9e333972a10ca323e700496a64e7ddcc3a6725e6afbbae52e690f4a4a 25.17MB / 52.63MB 2.3s
#6 sha256:efbef6f9e333972a10ca323e700496a64e7ddcc3a6725e6afbbae52e690f4a4a 28.31MB / 52.63MB 2.4s
#6 sha256:efbef6f9e333972a10ca323e700496a64e7ddcc3a6725e6afbbae52e690f4a4a 31.46MB / 52.63MB 2.7s
#6 sha256:efbef6f9e333972a10ca323e700496a64e7ddcc3a6725e6afbbae52e690f4a4a 36.70MB / 52.63MB 3.0s
#6 sha256:efbef6f9e333972a10ca323e700496a64e7ddcc3a6725e6afbbae52e690f4a4a 40.89MB / 52.63MB 3.3s
#6 sha256:efbef6f9e333972a10ca323e700496a64e7ddcc3a6725e6afbbae52e690f4a4a 46.14MB / 52.63MB 3.6s
#6 sha256:efbef6f9e333972a10ca323e700496a64e7ddcc3a6725e6afbbae52e690f4a4a 50.33MB / 52.63MB 3.9s
#6 sha256:efbef6f9e333972a10ca323e700496a64e7ddcc3a6725e6afbbae52e690f4a4a 52.63MB / 52.63MB 4.3s done
#6 extracting sha256:efbef6f9e333972a10ca323e700496a64e7ddcc3a6725e6afbbae52e690f4a4a
#6 extracting sha256:efbef6f9e333972a10ca323e700496a64e7ddcc3a6725e6afbbae52e690f4a4a 2.1s done
#6 extracting sha256:a2980c1fee17dfd6263234b253955e0e9d5f38d47c0e71c001139897134899d0
#6 extracting sha256:a2980c1fee17dfd6263234b253955e0e9d5f38d47c0e71c001139897134899d0 0.1s done
#6 extracting sha256:16da5a6403776464b5bf551ef294de57da242eac594527ea551a46e7f76ac2d6 0.0s done
#6 DONE 6.8s

#7 [build 2/7] WORKDIR /app
#7 DONE 0.2s

#8 [build 3/7] COPY package*.json ./
#8 DONE 0.1s

#9 [build 4/7] RUN npm install
#9 2.931 
#9 2.931 added 1 package, and audited 2 packages in 3s
#9 2.933 
#9 2.933 found 0 vulnerabilities
#9 2.936 npm notice
#9 2.936 npm notice New major version of npm available! 10.9.8 -> 12.0.2
#9 2.936 npm notice Changelog: https://github.com/npm/cli/releases/tag/v12.0.2
#9 2.936 npm notice To update run: npm install -g npm@12.0.2
#9 2.936 npm notice
#9 DONE 3.1s

#10 [build 5/7] COPY tsconfig.json ./
#10 DONE 0.1s

#11 [build 6/7] COPY src ./src
#11 DONE 0.1s

#12 [build 7/7] RUN npm run build
#12 0.422 
#12 0.422 > hello-multistage@1.0.0 build
#12 0.422 > tsc
#12 0.422 
#12 DONE 3.1s

#13 [runtime 3/3] COPY --from=build /app/dist ./dist
#13 DONE 0.0s

#14 exporting to image
#14 exporting layers 0.1s done
#14 exporting manifest sha256:f88cc68324c4e4e9fd2b899533a133640e5141d7df4054fddc924f04c9817ebc 0.0s done
#14 exporting config sha256:e31efe3e2d7c27cd6d5a26d4722bcfb3b5a69d3b71da51729af315aced87d882 0.0s done
#14 exporting attestation manifest sha256:4c4201042cbad57c640fa639ce1e0e80e0cd1c8fd93e18ef3f2e93db09a60091 0.0s done
#14 exporting manifest list sha256:bb92b42cc7d708acfa5c08cca4b07443820a6b8bd8806ac0d84ddd90496e594e 0.0s done
#14 naming to docker.io/library/hello-multistage:latest done
#14 unpacking to docker.io/library/hello-multistage:latest
#14 unpacking to docker.io/library/hello-multistage:latest 0.1s done
#14 DONE 0.4s

$ docker run --rm hello-multistage
Atividade 23: imagem final gerada por build multi-stage.

$ docker images hello-multistage
IMAGE                     ID             DISK USAGE   CONTENT SIZE   EXTRA
hello-multistage:latest   bb92b42cc7d7        232MB         57.8MB        

```

