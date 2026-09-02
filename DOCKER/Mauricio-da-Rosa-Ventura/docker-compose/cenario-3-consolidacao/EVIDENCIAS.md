# Evidência de execução — Cenário 3 (consolidação)

Gerado em: 2026-08-28 14:46:41 -0300

## 1. Subindo a pilha (`docker compose up -d --build`)

```
 Image ads-cenario-3-frontend Building 
 Image ads-cenario-3-api Building 
 Image ads-cenario-3-worker Building 
#1 [internal] load local bake definitions
#1 reading from stdin 2.23kB 0.0s done
#1 DONE 0.0s

#2 [worker internal] load build definition from Dockerfile
#2 transferring dockerfile: 146B 0.0s done
#2 DONE 0.0s

#3 [api internal] load build definition from Dockerfile
#3 transferring dockerfile: 155B 0.0s done
#3 DONE 0.0s

#4 [frontend internal] load build definition from Dockerfile
#4 transferring dockerfile: 155B 0.0s done
#4 DONE 0.1s

#5 [frontend internal] load metadata for docker.io/library/node:22-alpine
#5 DONE 0.6s

#6 [frontend internal] load .dockerignore
#6 transferring context: 2B done
#6 DONE 0.0s

#7 [api internal] load .dockerignore
#7 transferring context: 2B done
#7 DONE 0.0s

#8 [worker internal] load .dockerignore
#8 transferring context: 2B 0.0s done
#8 DONE 0.1s

#9 [worker internal] load build context
#9 transferring context: 3.00kB 0.1s done
#9 DONE 0.1s

#10 [worker 1/5] FROM docker.io/library/node:22-alpine@sha256:c610fcdfb1d5b4740dd70c284ed3cb16bb857e0f7166196e36a5501df7a3aa32
#10 resolve docker.io/library/node:22-alpine@sha256:c610fcdfb1d5b4740dd70c284ed3cb16bb857e0f7166196e36a5501df7a3aa32 0.1s done
#10 DONE 0.1s

#11 [frontend internal] load build context
#11 transferring context: 2.87kB 0.1s done
#11 DONE 0.1s

#12 [frontend 2/5] WORKDIR /app
#12 CACHED

#13 [worker 3/5] COPY package*.json ./
#13 DONE 0.1s

#14 [frontend 3/5] COPY package*.json ./
#14 DONE 0.1s

#15 [api internal] load build context
#15 transferring context: 4.80kB 0.1s done
#15 DONE 0.1s

#16 [api 3/5] COPY package*.json ./
#16 DONE 0.1s

#17 [worker 4/5] RUN npm install
#17 4.849 
#17 4.849 added 19 packages, and audited 20 packages in 4s
#17 4.853 
#17 4.853 found 0 vulnerabilities
#17 4.861 npm notice
#17 4.861 npm notice New major version of npm available! 10.9.8 -> 12.0.2
#17 4.861 npm notice Changelog: https://github.com/npm/cli/releases/tag/v12.0.2
#17 4.861 npm notice To update run: npm install -g npm@12.0.2
#17 4.861 npm notice
#17 DONE 5.1s

#18 [api 4/5] RUN npm install
#18 ...

#19 [worker 5/5] COPY . .
#19 DONE 0.1s

#20 [frontend 4/5] RUN npm install
#20 ...

#21 [worker] exporting to image
#21 exporting layers
#21 exporting layers 0.7s done
#21 exporting manifest sha256:7e138c418fcb5bf1ee85332a87e1c2f89ebabd7897088cd1e52735e14b186bfa 0.0s done
#21 exporting config sha256:5d4dc22ff1de94f1afb3e3cafe8b89a8f58448c4e4187b4c82643eca713e4a58 0.0s done
#21 exporting attestation manifest sha256:44b8f2ccf69cd4e1e1720cad48773862dd7ff78f0e0c1edf281cc10e324d5037 0.0s done
#21 exporting manifest list sha256:353bc1562afd4796f409b7b5e6b9b8ba0cbabaf8666bbf326440ac99a40e5ede
#21 exporting manifest list sha256:353bc1562afd4796f409b7b5e6b9b8ba0cbabaf8666bbf326440ac99a40e5ede 0.0s done
#21 naming to docker.io/library/ads-cenario-3-worker:latest done
#21 unpacking to docker.io/library/ads-cenario-3-worker:latest
#21 unpacking to docker.io/library/ads-cenario-3-worker:latest 0.7s done
#21 DONE 1.6s

#20 [frontend 4/5] RUN npm install
#20 ...

#22 [worker] resolving provenance for metadata file
#22 DONE 0.1s

#18 [api 4/5] RUN npm install
#18 10.87 
#18 10.87 added 76 packages, and audited 77 packages in 10s
#18 10.87 
#18 10.87 5 packages are looking for funding
#18 10.87   run `npm fund` for details
#18 10.88 
#18 10.88 2 high severity vulnerabilities
#18 10.88 
#18 10.88 To address all issues (including breaking changes), run:
#18 10.88   npm audit fix --force
#18 10.88 
#18 10.88 Run `npm audit` for details.
#18 10.89 npm notice
#18 10.89 npm notice New major version of npm available! 10.9.8 -> 12.0.2
#18 10.89 npm notice Changelog: https://github.com/npm/cli/releases/tag/v12.0.2
#18 10.89 npm notice To update run: npm install -g npm@12.0.2
#18 10.89 npm notice
#18 DONE 11.1s

#20 [frontend 4/5] RUN npm install
#20 ...

#23 [api 5/5] COPY . .
#23 DONE 0.1s

#24 [api] exporting to image
#24 exporting layers
#24 exporting layers 1.5s done
#24 exporting manifest sha256:1606603facaeb3fe0105317d5d14efc1e4b19bd0f844febfe118555662e212c4 0.0s done
#24 exporting config sha256:e8247fbabe7be2f9ac10f60ab8f277206da635b3e033680eb750bd102f36aa11 0.0s done
#24 exporting attestation manifest sha256:c22affac0b19af8c72a178e4ca61eb7cd078bfc9469319fecdb79d7938f1cd41 0.0s done
#24 exporting manifest list sha256:bb62d5b65d23601515389fad5300b1a838a7dd233449f7bd5e3c73548fd51722
#24 exporting manifest list sha256:bb62d5b65d23601515389fad5300b1a838a7dd233449f7bd5e3c73548fd51722 0.0s done
#24 naming to docker.io/library/ads-cenario-3-api:latest done
#24 unpacking to docker.io/library/ads-cenario-3-api:latest
#24 unpacking to docker.io/library/ads-cenario-3-api:latest 2.7s done
#24 DONE 4.5s

#20 [frontend 4/5] RUN npm install
#20 ...

#25 [api] resolving provenance for metadata file
#25 DONE 0.0s

#20 [frontend 4/5] RUN npm install
#20 16.56 
#20 16.56 added 30 packages, and audited 31 packages in 16s
#20 16.56 
#20 16.56 4 packages are looking for funding
#20 16.56   run `npm fund` for details
#20 16.58 
#20 16.58 2 vulnerabilities (1 moderate, 1 high)
#20 16.58 
#20 16.58 To address all issues (including breaking changes), run:
#20 16.58   npm audit fix --force
#20 16.58 
#20 16.58 Run `npm audit` for details.
#20 16.59 npm notice
#20 16.59 npm notice New major version of npm available! 10.9.8 -> 12.0.2
#20 16.59 npm notice Changelog: https://github.com/npm/cli/releases/tag/v12.0.2
#20 16.59 npm notice To update run: npm install -g npm@12.0.2
#20 16.59 npm notice
#20 DONE 17.2s

#26 [frontend 5/5] COPY . .
#26 DONE 0.3s

#27 [frontend] exporting to image
#27 exporting layers 11.6s done
#27 exporting manifest sha256:e8b0de3ed10ddc9cf5042fc97231a96e3a9a5b48a0a5d465e6ad4a4f7af8e867 0.0s done
#27 exporting config sha256:53ab6263fbc1023a81e4c924c95dbb9f49373fdc3c3d1d726cd9e2c25eb1fcfa 0.0s done
#27 exporting attestation manifest sha256:88c792062286a9f8631183acd70c0d07941a46d6b6193a3237143266efd1abd9 0.0s done
#27 exporting manifest list sha256:b874e862dbf8ebab41c3de69582a376c4162cbd09eb197ba39e1794896bab6df
#27 exporting manifest list sha256:b874e862dbf8ebab41c3de69582a376c4162cbd09eb197ba39e1794896bab6df 0.1s done
#27 naming to docker.io/library/ads-cenario-3-frontend:latest done
#27 unpacking to docker.io/library/ads-cenario-3-frontend:latest
#27 unpacking to docker.io/library/ads-cenario-3-frontend:latest 3.6s done
#27 DONE 15.5s

#28 [frontend] resolving provenance for metadata file
#28 DONE 0.1s
 Image ads-cenario-3-frontend Built 
 Image ads-cenario-3-worker Built 
 Image ads-cenario-3-api Built 
 Network ads-cenario-3_app_net Creating 
 Volume ads-cenario-3_backend_node_modules Creating 
 Volume ads-cenario-3_frontend_node_modules Creating 
 Volume ads-cenario-3_postgres_data Creating 
 Volume ads-cenario-3_redis_data Creating 
 Volume ads-cenario-3_redis_data Creating 
 Volume ads-cenario-3_backend_node_modules Creating 
 Volume ads-cenario-3_postgres_data Creating 
 Network ads-cenario-3_app_net Creating 
 Volume ads-cenario-3_frontend_node_modules Creating 
 Volume ads-cenario-3_postgres_data Created 
 Volume ads-cenario-3_postgres_data Created 
 Volume ads-cenario-3_frontend_node_modules Created 
 Volume ads-cenario-3_frontend_node_modules Created 
 Volume ads-cenario-3_redis_data Created 
 Volume ads-cenario-3_redis_data Created 
 Volume ads-cenario-3_backend_node_modules Created 
 Volume ads-cenario-3_backend_node_modules Created 
 Network ads-cenario-3_app_net Created 
 Network ads-cenario-3_app_net Created 
 Container ads-cenario-3-postgres-1 Creating 
 Container ads-cenario-3-redis-1 Creating 
 Container ads-cenario-3-rabbitmq-1 Creating 
 Container ads-cenario-3-redis-1 Created 
 Container ads-cenario-3-postgres-1 Created 
 Container ads-cenario-3-rabbitmq-1 Created 
 Container ads-cenario-3-worker-1 Creating 
 Container ads-cenario-3-api-1 Creating 
 Container ads-cenario-3-worker-1 Created 
 Container ads-cenario-3-api-1 Created 
 Container ads-cenario-3-frontend-1 Creating 
 Container ads-cenario-3-frontend-1 Created 
 Container ads-cenario-3-rabbitmq-1 Starting 
 Container ads-cenario-3-postgres-1 Starting 
 Container ads-cenario-3-redis-1 Starting 
 Container ads-cenario-3-redis-1 Started 
 Container ads-cenario-3-rabbitmq-1 Started 
 Container ads-cenario-3-postgres-1 Started 
 Container ads-cenario-3-rabbitmq-1 Waiting 
 Container ads-cenario-3-postgres-1 Waiting 
 Container ads-cenario-3-postgres-1 Waiting 
 Container ads-cenario-3-rabbitmq-1 Waiting 
 Container ads-cenario-3-postgres-1 Healthy 
 Container ads-cenario-3-postgres-1 Healthy 
 Container ads-cenario-3-rabbitmq-1 Healthy 
 Container ads-cenario-3-api-1 Starting 
 Container ads-cenario-3-rabbitmq-1 Healthy 
 Container ads-cenario-3-worker-1 Starting 
 Container ads-cenario-3-worker-1 Started 
 Container ads-cenario-3-api-1 Started 
 Container ads-cenario-3-frontend-1 Starting 
 Container ads-cenario-3-frontend-1 Started 
```

Aguardando postgres, rabbitmq e api ficarem healthy (até 2 minutos)...

## 2. `docker compose ps` — todos os serviços, status e portas

```
NAME                       IMAGE                    COMMAND                  SERVICE    CREATED          STATUS                    PORTS
ads-cenario-3-api-1        ads-cenario-3-api        "docker-entrypoint.s…"   api        35 seconds ago   Up 12 seconds (healthy)   0.0.0.0:3001->3000/tcp, [::]:3001->3000/tcp
ads-cenario-3-frontend-1   ads-cenario-3-frontend   "docker-entrypoint.s…"   frontend   30 seconds ago   Up 11 seconds             0.0.0.0:5174->5173/tcp, [::]:5174->5173/tcp
ads-cenario-3-postgres-1   postgres:17-alpine       "docker-entrypoint.s…"   postgres   39 seconds ago   Up 27 seconds (healthy)   5432/tcp
ads-cenario-3-rabbitmq-1   rabbitmq:4-management    "docker-entrypoint.s…"   rabbitmq   39 seconds ago   Up 27 seconds (healthy)   0.0.0.0:15674->15672/tcp, [::]:15674->15672/tcp
ads-cenario-3-redis-1      redis:7.4-alpine         "docker-entrypoint.s…"   redis      39 seconds ago   Up 28 seconds             6379/tcp
ads-cenario-3-worker-1     ads-cenario-3-worker     "docker-entrypoint.s…"   worker     35 seconds ago   Up 12 seconds             
```

## 3. Healthcheck e comunicação entre serviços (`GET /health`, `GET /status`)

```
$ curl -sS http://localhost:3001/health
{"status":"ok"}

$ curl -sS http://localhost:3001/status
{"postgres":{"ok":true,"totalEventos":1},"redis":{"ok":true,"valor":"2026-08-28T17:47:59.040Z"},"rabbitmq":{"ok":true,"fila":"cenario3.eventos"}}```

## 4. Disparando um evento de ponta a ponta (`POST /eventos`)

```
$ curl -sS -X POST http://localhost:3001/eventos -H "Content-Type: application/json" -d '{"tipo":"evento-de-teste"}'
{"ok":true,"tipo":"evento-de-teste"}
```

## 5. Logs do worker (prova de que o evento foi consumido e processado)

```
worker-1  | 
worker-1  | > cenario-3-worker@1.0.0 worker
worker-1  | > node src/worker.js
worker-1  | 
worker-1  | [worker] RabbitMQ ainda nao disponivel (tentativa 1/10): connect ECONNREFUSED 172.24.0.3:5672
worker-1  | [worker] RabbitMQ ainda nao disponivel (tentativa 2/10): connect ECONNREFUSED 172.24.0.3:5672
worker-1  | [worker] conectado ao RabbitMQ, aguardando mensagens em "cenario3.eventos"...
worker-1  | [worker] mensagem recebida: { tipo: 'evento-de-teste', em: '2026-08-28T17:47:59.359Z' }
worker-1  | [worker] evento "evento-de-teste" marcado como processado no Postgres.
```

## 6. Logs da api

```
api-1  | 
api-1  | > cenario-3-api@1.0.0 dev
api-1  | > node src/index.js
api-1  | 
api-1  | {"level":30,"time":1787939269609,"pid":18,"hostname":"1a71dc1a50a2","msg":"Server listening at http://0.0.0.0:3000"}
api-1  | {"level":30,"time":1787939269613,"pid":18,"hostname":"1a71dc1a50a2","msg":"API do Cenario 3 (Fastify) ouvindo na porta 3000"}
api-1  | {"level":30,"time":1787939276619,"pid":18,"hostname":"1a71dc1a50a2","reqId":"req-1","req":{"method":"GET","url":"/health","hostname":"localhost:3000","remoteAddress":"127.0.0.1","remotePort":40982},"msg":"incoming request"}
api-1  | {"level":30,"time":1787939276638,"pid":18,"hostname":"1a71dc1a50a2","reqId":"req-1","res":{"statusCode":200},"responseTime":17.05838599987328,"msg":"request completed"}
api-1  | {"level":30,"time":1787939278782,"pid":18,"hostname":"1a71dc1a50a2","reqId":"req-2","req":{"method":"GET","url":"/health","hostname":"localhost:3001","remoteAddress":"172.24.0.1","remotePort":33976},"msg":"incoming request"}
api-1  | {"level":30,"time":1787939278785,"pid":18,"hostname":"1a71dc1a50a2","reqId":"req-2","res":{"statusCode":200},"responseTime":2.1527090000454336,"msg":"request completed"}
api-1  | {"level":30,"time":1787939278965,"pid":18,"hostname":"1a71dc1a50a2","reqId":"req-3","req":{"method":"GET","url":"/status","hostname":"localhost:3001","remoteAddress":"172.24.0.1","remotePort":33988},"msg":"incoming request"}
api-1  | {"level":30,"time":1787939279121,"pid":18,"hostname":"1a71dc1a50a2","reqId":"req-3","res":{"statusCode":200},"responseTime":155.80758700007573,"msg":"request completed"}
api-1  | {"level":30,"time":1787939279274,"pid":18,"hostname":"1a71dc1a50a2","reqId":"req-4","req":{"method":"POST","url":"/eventos","hostname":"localhost:3001","remoteAddress":"172.24.0.1","remotePort":33994},"msg":"incoming request"}
api-1  | {"level":30,"time":1787939279411,"pid":18,"hostname":"1a71dc1a50a2","reqId":"req-4","res":{"statusCode":201},"responseTime":136.771599000087,"msg":"request completed"}
```

## 7. `docker inspect` do healthcheck da api

```
{"Status":"healthy","FailingStreak":0,"Log":[{"Start":"2026-08-28T17:47:56.367256554Z","End":"2026-08-28T17:47:56.648423369Z","ExitCode":0,"Output":""}]}
```
