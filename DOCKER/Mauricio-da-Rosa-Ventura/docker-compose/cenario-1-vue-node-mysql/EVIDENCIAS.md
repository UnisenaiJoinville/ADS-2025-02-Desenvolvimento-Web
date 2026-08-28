# Evidência de execução — Cenário 1 (VueJS + NodeJS + MySQL + Redis + RabbitMQ)

Gerado em: 2026-08-28 14:28:29 -0300

## 1. Subindo a pilha (`docker compose up -d --build`)

```
 Image ads-cenario-1-worker Building 
 Image ads-cenario-1-frontend Building 
 Image ads-cenario-1-api Building 
#1 [internal] load local bake definitions
#1 reading from stdin 2.24kB 0.0s done
#1 DONE 0.0s

#2 [api internal] load build definition from Dockerfile
#2 transferring dockerfile: 155B 0.0s done
#2 DONE 0.1s

#3 [worker internal] load build definition from Dockerfile
#3 transferring dockerfile: 146B 0.0s done
#3 DONE 0.1s

#4 [frontend internal] load build definition from Dockerfile
#4 transferring dockerfile: 155B 0.0s done
#4 DONE 0.1s

#5 [frontend internal] load metadata for docker.io/library/node:22-alpine
#5 DONE 0.6s

#6 [worker internal] load .dockerignore
#6 transferring context: 2B done
#6 DONE 0.0s

#7 [api internal] load .dockerignore
#7 transferring context: 2B done
#7 DONE 0.0s

#8 [frontend internal] load .dockerignore
#8 transferring context: 2B done
#8 DONE 0.1s

#9 [frontend 1/5] FROM docker.io/library/node:22-alpine@sha256:c610fcdfb1d5b4740dd70c284ed3cb16bb857e0f7166196e36a5501df7a3aa32
#9 resolve docker.io/library/node:22-alpine@sha256:c610fcdfb1d5b4740dd70c284ed3cb16bb857e0f7166196e36a5501df7a3aa32
#9 resolve docker.io/library/node:22-alpine@sha256:c610fcdfb1d5b4740dd70c284ed3cb16bb857e0f7166196e36a5501df7a3aa32 0.1s done
#9 DONE 0.1s

#10 [worker internal] load build context
#10 transferring context: 2.23kB 0.1s done
#10 DONE 0.1s

#11 [api internal] load build context
#11 transferring context: 4.57kB 0.1s done
#11 DONE 0.1s

#12 [frontend 2/5] WORKDIR /app
#12 CACHED

#13 [api 3/5] COPY package*.json ./
#13 DONE 0.1s

#14 [frontend internal] load build context
#14 transferring context: 2.62kB 0.1s done
#14 DONE 0.1s

#15 [worker 3/5] COPY package*.json ./
#15 DONE 0.1s

#16 [frontend 3/5] COPY package*.json ./
#16 DONE 0.1s

#17 [frontend 4/5] RUN npm install
#17 ...

#18 [worker 4/5] RUN npm install
#18 2.869 
#18 2.869 added 5 packages, and audited 6 packages in 2s
#18 2.870 
#18 2.870 found 0 vulnerabilities
#18 2.873 npm notice
#18 2.873 npm notice New major version of npm available! 10.9.8 -> 12.0.2
#18 2.873 npm notice Changelog: https://github.com/npm/cli/releases/tag/v12.0.2
#18 2.873 npm notice To update run: npm install -g npm@12.0.2
#18 2.873 npm notice
#18 DONE 3.1s

#19 [worker 5/5] COPY . .
#19 DONE 0.1s

#20 [worker] exporting to image
#20 exporting layers
#20 exporting layers 0.5s done
#20 exporting manifest sha256:982b21493ee2882f39509309e5d2b110051982a5e36a2cdc094936b212467ea4 0.0s done
#20 exporting config sha256:2cecd4c5315e768b91d9b5569cb561eb877e8306d14c010405c4b5c1c5262e96 0.0s done
#20 exporting attestation manifest sha256:14794d841865b83aa95cbf99adf1c98cabccf846b1a17654c55ee61ea8b87e69 0.0s done
#20 exporting manifest list sha256:82b32eaf9c66119d5bf601b0763c118e73573f237e739779118ce4759980486d
#20 exporting manifest list sha256:82b32eaf9c66119d5bf601b0763c118e73573f237e739779118ce4759980486d 0.0s done
#20 naming to docker.io/library/ads-cenario-1-worker:latest done
#20 unpacking to docker.io/library/ads-cenario-1-worker:latest
#20 unpacking to docker.io/library/ads-cenario-1-worker:latest 0.4s done
#20 DONE 1.2s

#21 [api 4/5] RUN npm install
#21 ...

#22 [worker] resolving provenance for metadata file
#22 DONE 0.1s

#17 [frontend 4/5] RUN npm install
#17 ...

#21 [api 4/5] RUN npm install
#21 6.113 
#21 6.113 added 26 packages, and audited 27 packages in 6s
#21 6.113 
#21 6.113 4 packages are looking for funding
#21 6.113   run `npm fund` for details
#21 6.117 
#21 6.117 found 0 vulnerabilities
#21 6.123 npm notice
#21 6.123 npm notice New major version of npm available! 10.9.8 -> 12.0.2
#21 6.123 npm notice Changelog: https://github.com/npm/cli/releases/tag/v12.0.2
#21 6.123 npm notice To update run: npm install -g npm@12.0.2
#21 6.123 npm notice
#21 DONE 6.3s

#17 [frontend 4/5] RUN npm install
#17 ...

#23 [api 5/5] COPY . .
#23 DONE 0.1s

#24 [api] exporting to image
#24 exporting layers 1.0s done
#24 exporting manifest sha256:c6ed18a7e940f4594a2ef65d0eb4128429ef55ac720615c12c2bc5b0d78c457c 0.0s done
#24 exporting config sha256:9b8e7081a977be7a3ea8318d518927bdadbc139bd034bdaf000bed8424918c3c 0.0s done
#24 exporting attestation manifest sha256:ff5de152a7ee159fa32ec2cd90c5ea7e653d4325fd5e12ee6268a88bafa96b29 0.0s done
#24 exporting manifest list sha256:8230445a94b9c0e2693d1b73e9e81d46468e1c5de1cc41eaf3012b3c13b33a3c 0.0s done
#24 naming to docker.io/library/ads-cenario-1-api:latest done
#24 unpacking to docker.io/library/ads-cenario-1-api:latest
#24 unpacking to docker.io/library/ads-cenario-1-api:latest 0.7s done
#24 DONE 1.8s

#17 [frontend 4/5] RUN npm install
#17 ...

#25 [api] resolving provenance for metadata file
#25 DONE 0.0s

#17 [frontend 4/5] RUN npm install
#17 14.51 
#17 14.51 added 30 packages, and audited 31 packages in 14s
#17 14.51 
#17 14.51 4 packages are looking for funding
#17 14.51   run `npm fund` for details
#17 14.53 
#17 14.53 2 vulnerabilities (1 moderate, 1 high)
#17 14.53 
#17 14.53 To address all issues (including breaking changes), run:
#17 14.53   npm audit fix --force
#17 14.53 
#17 14.53 Run `npm audit` for details.
#17 14.53 npm notice
#17 14.53 npm notice New major version of npm available! 10.9.8 -> 12.0.2
#17 14.53 npm notice Changelog: https://github.com/npm/cli/releases/tag/v12.0.2
#17 14.53 npm notice To update run: npm install -g npm@12.0.2
#17 14.53 npm notice
#17 DONE 15.6s

#26 [frontend 5/5] COPY . .
#26 DONE 0.1s

#27 [frontend] exporting to image
#27 exporting layers
#27 exporting layers 6.5s done
#27 exporting manifest sha256:89eab92d866421c54218a2c4bbb6b28b02bd392920c050164910af52c742a7ff 0.0s done
#27 exporting config sha256:540af7f537a1a85490afbf939381ca0e2a52c8c97c0b7f1176814dfc72cae324 0.0s done
#27 exporting attestation manifest sha256:d32c354cae9f5a72f550298495691b3fcad4f7fe0600a4e24cc1f0200f972425
#27 exporting attestation manifest sha256:d32c354cae9f5a72f550298495691b3fcad4f7fe0600a4e24cc1f0200f972425 0.0s done
#27 exporting manifest list sha256:5f7952e4b13d2939639c45f0a49d410ff2ac71000a6eb9683ade8f25d62ce083 0.0s done
#27 naming to docker.io/library/ads-cenario-1-frontend:latest done
#27 unpacking to docker.io/library/ads-cenario-1-frontend:latest
#27 unpacking to docker.io/library/ads-cenario-1-frontend:latest 3.4s done
#27 DONE 10.2s

#28 [frontend] resolving provenance for metadata file
#28 DONE 0.1s
 Image ads-cenario-1-worker Built 
 Image ads-cenario-1-api Built 
 Image ads-cenario-1-frontend Built 
 Volume ads-cenario-1_frontend_node_modules Creating 
 Network ads-cenario-1_app_net Creating 
 Network ads-cenario-1_app_net Creating 
 Volume ads-cenario-1_backend_node_modules Creating 
 Volume ads-cenario-1_mysql_data Creating 
 Volume ads-cenario-1_redis_data Creating 
 Volume ads-cenario-1_backend_node_modules Creating 
 Volume ads-cenario-1_redis_data Creating 
 Volume ads-cenario-1_frontend_node_modules Creating 
 Volume ads-cenario-1_mysql_data Creating 
 Volume ads-cenario-1_redis_data Created 
 Volume ads-cenario-1_redis_data Created 
 Volume ads-cenario-1_backend_node_modules Created 
 Volume ads-cenario-1_backend_node_modules Created 
 Volume ads-cenario-1_frontend_node_modules Created 
 Volume ads-cenario-1_frontend_node_modules Created 
 Volume ads-cenario-1_mysql_data Created 
 Volume ads-cenario-1_mysql_data Created 
 Network ads-cenario-1_app_net Created 
 Network ads-cenario-1_app_net Created 
 Container ads-cenario-1-redis-1 Creating 
 Container ads-cenario-1-rabbitmq-1 Creating 
 Container ads-cenario-1-mysql-1 Creating 
 Container ads-cenario-1-redis-1 Created 
 Container ads-cenario-1-rabbitmq-1 Created 
 Container ads-cenario-1-mysql-1 Created 
 Container ads-cenario-1-worker-1 Creating 
 Container ads-cenario-1-api-1 Creating 
 Container ads-cenario-1-worker-1 Created 
 Container ads-cenario-1-api-1 Created 
 Container ads-cenario-1-frontend-1 Creating 
 Container ads-cenario-1-frontend-1 Created 
 Container ads-cenario-1-redis-1 Starting 
 Container ads-cenario-1-mysql-1 Starting 
 Container ads-cenario-1-rabbitmq-1 Starting 
 Container ads-cenario-1-redis-1 Started 
 Container ads-cenario-1-rabbitmq-1 Started 
 Container ads-cenario-1-mysql-1 Started 
 Container ads-cenario-1-rabbitmq-1 Waiting 
 Container ads-cenario-1-mysql-1 Waiting 
 Container ads-cenario-1-mysql-1 Waiting 
 Container ads-cenario-1-rabbitmq-1 Waiting 
 Container ads-cenario-1-rabbitmq-1 Healthy 
 Container ads-cenario-1-rabbitmq-1 Healthy 
 Container ads-cenario-1-mysql-1 Healthy 
 Container ads-cenario-1-api-1 Starting 
 Container ads-cenario-1-mysql-1 Healthy 
 Container ads-cenario-1-worker-1 Starting 
 Container ads-cenario-1-worker-1 Started 
 Container ads-cenario-1-api-1 Started 
 Container ads-cenario-1-frontend-1 Starting 
 Container ads-cenario-1-frontend-1 Started 
```

Aguardando mysql e rabbitmq ficarem healthy (até 90s)...

## 2. `docker compose ps` — status e portas

```
NAME                       IMAGE                    COMMAND                  SERVICE    CREATED          STATUS                    PORTS
ads-cenario-1-api-1        ads-cenario-1-api        "docker-entrypoint.s…"   api        27 seconds ago   Up 4 seconds              0.0.0.0:3000->3000/tcp, [::]:3000->3000/tcp
ads-cenario-1-frontend-1   ads-cenario-1-frontend   "docker-entrypoint.s…"   frontend   27 seconds ago   Up 3 seconds              0.0.0.0:5173->5173/tcp, [::]:5173->5173/tcp
ads-cenario-1-mysql-1      mysql:8.4                "docker-entrypoint.s…"   mysql      30 seconds ago   Up 25 seconds (healthy)   0.0.0.0:3306->3306/tcp, [::]:3306->3306/tcp
ads-cenario-1-rabbitmq-1   rabbitmq:4-management    "docker-entrypoint.s…"   rabbitmq   30 seconds ago   Up 25 seconds (healthy)   0.0.0.0:5672->5672/tcp, [::]:5672->5672/tcp, 0.0.0.0:15672->15672/tcp, [::]:15672->15672/tcp
ads-cenario-1-redis-1      redis:7.4-alpine         "docker-entrypoint.s…"   redis      30 seconds ago   Up 25 seconds             0.0.0.0:6379->6379/tcp, [::]:6379->6379/tcp
ads-cenario-1-worker-1     ads-cenario-1-worker     "docker-entrypoint.s…"   worker     27 seconds ago   Up 4 seconds              
```

## 3. Logs da api (`docker compose logs api`)

```
