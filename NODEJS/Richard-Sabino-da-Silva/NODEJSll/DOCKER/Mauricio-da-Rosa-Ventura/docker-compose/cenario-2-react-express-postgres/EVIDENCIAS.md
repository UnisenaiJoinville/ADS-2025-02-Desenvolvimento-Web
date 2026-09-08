# Evidência de execução — Cenário 2 (ReactJS + PostgreSQL + Node/Express + Redis + RabbitMQ + Nginx)

Gerado em: 2026-08-28 14:42:47 -0300

## 1. Subindo o cenário base (`docker compose up -d --build`)

```
 Image postgres:17-alpine Pulling 
 Image nginx:1.27-alpine Pulling 
 39c2ddfd6010 Pulling fs layer 0B
 d7e507024086 Pulling fs layer 0B
 197eb75867ef Pulling fs layer 0B
 61ca4f733c80 Pulling fs layer 0B
 81bd8ed7ec67 Pulling fs layer 0B
 b464cfdf2a63 Pulling fs layer 0B
 f18232174bc9 Pulling fs layer 0B
 34a64644b756 Pulling fs layer 0B
 7f3590dcd843 Pulling fs layer 0B
 592349920552 Pulling fs layer 0B
 4d80c046a9c7 Pulling fs layer 0B
 75de48f507ff Pulling fs layer 0B
 a12187db4b17 Pulling fs layer 0B
 5858a3f690ea Pulling fs layer 0B
 b36c1b75fdb7 Pulling fs layer 0B
 d884d6f49732 Pulling fs layer 0B
 f070a6577866 Pulling fs layer 0B
 61ca4f733c80 Download complete 0B
 b464cfdf2a63 Downloading 629B
 197eb75867ef Downloading 1.209kB
 b464cfdf2a63 Download complete 0B
 197eb75867ef Download complete 0B
 81bd8ed7ec67 Download complete 0B
 39c2ddfd6010 Downloading 1.049MB
 39c2ddfd6010 Downloading 2.097MB
 d7e507024086 Download complete 0B
 39c2ddfd6010 Downloading 3.146MB
 34a64644b756 Download complete 0B
 39c2ddfd6010 Downloading 3.146MB
 39c2ddfd6010 Downloading 4.194MB
 39c2ddfd6010 Downloading 5.243MB
 39c2ddfd6010 Downloading 6.291MB
 39c2ddfd6010 Downloading 7.34MB
 39c2ddfd6010 Downloading 8.389MB
 f18232174bc9 Downloading 1.049MB
 39c2ddfd6010 Downloading 9.437MB
 39c2ddfd6010 Downloading 10.49MB
 f18232174bc9 Downloading 1.049MB
 f18232174bc9 Downloading 1.049MB
 39c2ddfd6010 Downloading 11.53MB
 f18232174bc9 Downloading 1.049MB
 39c2ddfd6010 Downloading 12.58MB
 f18232174bc9 Downloading 2.097MB
 39c2ddfd6010 Downloading 13.63MB
 f18232174bc9 Downloading 2.097MB
 39c2ddfd6010 Downloading 14.68MB
 f18232174bc9 Downloading 3.146MB
 39c2ddfd6010 Download complete 0B
 f18232174bc9 Download complete 0B
 f18232174bc9 Extracting 1B
 75de48f507ff Download complete 0B
 f18232174bc9 Extracting 1B
 f18232174bc9 Extracting 1B
 592349920552 Download complete 0B
 7f3590dcd843 Download complete 0B
 f18232174bc9 Extracting 1B
 5858a3f690ea Downloading 1.049MB
 f18232174bc9 Extracting 1B
 5858a3f690ea Downloading 2.097MB
 4d80c046a9c7 Download complete 0B
 a12187db4b17 Download complete 0B
 4d80c046a9c7 Pull complete 0B
 f18232174bc9 Extracting 1B
 b36c1b75fdb7 Downloading 169B
 5858a3f690ea Downloading 3.146MB
 592349920552 Pull complete 0B
 f18232174bc9 Extracting 1B
 b36c1b75fdb7 Download complete 0B
 5858a3f690ea Downloading 4.194MB
 a12187db4b17 Pull complete 0B
 f18232174bc9 Extracting 1B
 5858a3f690ea Downloading 4.194MB
 d884d6f49732 Download complete 0B
 f070a6577866 Download complete 0B
 f18232174bc9 Extracting 1B
 5858a3f690ea Downloading 5.243MB
 f18232174bc9 Extracting 1B
 5858a3f690ea Downloading 6.291MB
 f18232174bc9 Extracting 2B
 5858a3f690ea Downloading 7.34MB
 c840388241a4 Download complete 0B
 f18232174bc9 Extracting 2B
 5858a3f690ea Downloading 8.389MB
 f18232174bc9 Extracting 2B
 5858a3f690ea Downloading 8.389MB
 f18232174bc9 Extracting 2B
 5858a3f690ea Downloading 9.437MB
 f18232174bc9 Extracting 2B
 5858a3f690ea Downloading 10.49MB
 e45d7f7da77a Download complete 0B
 f18232174bc9 Extracting 2B
 5858a3f690ea Downloading 11.53MB
 f18232174bc9 Extracting 2B
 5858a3f690ea Downloading 12.58MB
 f18232174bc9 Extracting 2B
 5858a3f690ea Downloading 12.58MB
 f18232174bc9 Extracting 2B
 5858a3f690ea Downloading 13.63MB
 f18232174bc9 Extracting 2B
 5858a3f690ea Downloading 14.68MB
 f18232174bc9 Extracting 3B
 5858a3f690ea Downloading 15.73MB
 f18232174bc9 Extracting 3B
 5858a3f690ea Downloading 16.78MB
 f18232174bc9 Extracting 3B
 5858a3f690ea Downloading 17.83MB
 f18232174bc9 Extracting 3B
 5858a3f690ea Downloading 17.83MB
 2a84448aca9c Download complete 0B
 5858a3f690ea Downloading 18.87MB
 9261b9aff737 Download complete 0B
 61ca4f733c80 Extracting 1B
 f18232174bc9 Pull complete 0B
 5858a3f690ea Downloading 19.92MB
 61ca4f733c80 Extracting 1B
 5858a3f690ea Downloading 20.97MB
 61ca4f733c80 Extracting 1B
 5858a3f690ea Downloading 20.97MB
 61ca4f733c80 Extracting 1B
 5858a3f690ea Downloading 22.02MB
 61ca4f733c80 Pull complete 0B
 5858a3f690ea Downloading 23.07MB
 b464cfdf2a63 Pull complete 0B
 81bd8ed7ec67 Extracting 1B
 d7e507024086 Pull complete 0B
 5858a3f690ea Downloading 24.12MB
 197eb75867ef Pull complete 0B
 81bd8ed7ec67 Pull complete 0B
 34a64644b756 Pull complete 0B
 5858a3f690ea Downloading 25.17MB
 39c2ddfd6010 Extracting 1B
 5858a3f690ea Downloading 26.21MB
 39c2ddfd6010 Extracting 1B
 5858a3f690ea Downloading 27.26MB
 39c2ddfd6010 Extracting 1B
 5858a3f690ea Downloading 28.31MB
 39c2ddfd6010 Extracting 1B
 5858a3f690ea Downloading 29.36MB
 39c2ddfd6010 Extracting 1B
 5858a3f690ea Downloading 29.36MB
 39c2ddfd6010 Extracting 1B
 5858a3f690ea Downloading 31.46MB
 39c2ddfd6010 Extracting 1B
 5858a3f690ea Downloading 32.51MB
 39c2ddfd6010 Extracting 1B
 5858a3f690ea Downloading 32.51MB
 39c2ddfd6010 Extracting 1B
 5858a3f690ea Downloading 34.6MB
 39c2ddfd6010 Extracting 1B
 5858a3f690ea Downloading 35.65MB
 39c2ddfd6010 Extracting 2B
 5858a3f690ea Downloading 35.65MB
 39c2ddfd6010 Extracting 2B
 5858a3f690ea Downloading 36.7MB
 39c2ddfd6010 Extracting 2B
 5858a3f690ea Downloading 37.75MB
 39c2ddfd6010 Pull complete 0B
 Image nginx:1.27-alpine Pulled 
 5858a3f690ea Downloading 38.8MB
 5858a3f690ea Downloading 39.85MB
 5858a3f690ea Downloading 40.89MB
 5858a3f690ea Downloading 41.94MB
 5858a3f690ea Downloading 42.99MB
 5858a3f690ea Downloading 44.04MB
 5858a3f690ea Downloading 44.04MB
 5858a3f690ea Downloading 45.09MB
 5858a3f690ea Downloading 47.19MB
 5858a3f690ea Downloading 47.19MB
 5858a3f690ea Downloading 48.23MB
 5858a3f690ea Downloading 49.28MB
 5858a3f690ea Downloading 49.28MB
 5858a3f690ea Downloading 49.28MB
 5858a3f690ea Downloading 50.33MB
 5858a3f690ea Downloading 50.33MB
 5858a3f690ea Downloading 51.38MB
 5858a3f690ea Downloading 51.38MB
 5858a3f690ea Downloading 52.43MB
 5858a3f690ea Downloading 52.43MB
 5858a3f690ea Downloading 52.43MB
 5858a3f690ea Downloading 53.48MB
 5858a3f690ea Downloading 53.48MB
 5858a3f690ea Downloading 53.48MB
 5858a3f690ea Downloading 53.48MB
 5858a3f690ea Downloading 53.48MB
 5858a3f690ea Downloading 53.48MB
 5858a3f690ea Downloading 53.48MB
 5858a3f690ea Downloading 53.48MB
 5858a3f690ea Downloading 53.48MB
 5858a3f690ea Downloading 54.53MB
 5858a3f690ea Downloading 54.53MB
 5858a3f690ea Downloading 54.53MB
 5858a3f690ea Downloading 55.57MB
 5858a3f690ea Downloading 55.57MB
 5858a3f690ea Downloading 56.62MB
 5858a3f690ea Downloading 56.62MB
 5858a3f690ea Downloading 57.67MB
 5858a3f690ea Downloading 57.67MB
 5858a3f690ea Downloading 57.67MB
 5858a3f690ea Downloading 58.72MB
 5858a3f690ea Downloading 58.72MB
 5858a3f690ea Downloading 59.77MB
 5858a3f690ea Downloading 59.77MB
 5858a3f690ea Downloading 60.82MB
 5858a3f690ea Downloading 61.87MB
 5858a3f690ea Downloading 61.87MB
 5858a3f690ea Downloading 62.91MB
 5858a3f690ea Downloading 63.96MB
 5858a3f690ea Downloading 63.96MB
 5858a3f690ea Downloading 65.01MB
 5858a3f690ea Downloading 66.06MB
 5858a3f690ea Downloading 66.06MB
 5858a3f690ea Downloading 67.11MB
 5858a3f690ea Downloading 68.16MB
 5858a3f690ea Downloading 69.21MB
 5858a3f690ea Downloading 69.21MB
 5858a3f690ea Downloading 71.3MB
 5858a3f690ea Downloading 71.3MB
 5858a3f690ea Downloading 73.4MB
 5858a3f690ea Downloading 74.45MB
 5858a3f690ea Downloading 75.5MB
 5858a3f690ea Downloading 76.55MB
 5858a3f690ea Downloading 77.59MB
 5858a3f690ea Downloading 78.64MB
 5858a3f690ea Downloading 79.69MB
 5858a3f690ea Downloading 80.74MB
 5858a3f690ea Downloading 81.79MB
 5858a3f690ea Downloading 82.84MB
 5858a3f690ea Downloading 83.89MB
 5858a3f690ea Downloading 84.93MB
 5858a3f690ea Downloading 85.98MB
 5858a3f690ea Downloading 85.98MB
 5858a3f690ea Downloading 87.03MB
 5858a3f690ea Downloading 88.08MB
 5858a3f690ea Downloading 89.13MB
 5858a3f690ea Downloading 91.23MB
 5858a3f690ea Downloading 92.27MB
 5858a3f690ea Downloading 94.37MB
 5858a3f690ea Downloading 95.42MB
 5858a3f690ea Downloading 96.47MB
 5858a3f690ea Downloading 97.52MB
 5858a3f690ea Downloading 98.57MB
 5858a3f690ea Downloading 99.61MB
 5858a3f690ea Downloading 100.7MB
 5858a3f690ea Downloading 101.7MB
 5858a3f690ea Downloading 102.8MB
 5858a3f690ea Downloading 103.8MB
 5858a3f690ea Downloading 103.8MB
 5858a3f690ea Downloading 103.8MB
 5858a3f690ea Downloading 105.9MB
 5858a3f690ea Downloading 107MB
 5858a3f690ea Downloading 108MB
 5858a3f690ea Downloading 109.1MB
 5858a3f690ea Downloading 110.1MB
 5858a3f690ea Downloading 112.2MB
 5858a3f690ea Downloading 112.4MB
 5858a3f690ea Download complete 0B
 5858a3f690ea Extracting 1B
 5858a3f690ea Extracting 1B
 5858a3f690ea Extracting 1B
 5858a3f690ea Extracting 1B
 5858a3f690ea Extracting 1B
 5858a3f690ea Extracting 1B
 5858a3f690ea Extracting 1B
 5858a3f690ea Extracting 1B
 5858a3f690ea Extracting 1B
 5858a3f690ea Extracting 1B
 5858a3f690ea Extracting 1B
 5858a3f690ea Extracting 2B
 5858a3f690ea Extracting 2B
 5858a3f690ea Extracting 2B
 5858a3f690ea Extracting 2B
 5858a3f690ea Extracting 2B
 5858a3f690ea Extracting 2B
 5858a3f690ea Extracting 2B
 5858a3f690ea Extracting 2B
 5858a3f690ea Extracting 2B
 5858a3f690ea Extracting 2B
 5858a3f690ea Extracting 3B
 5858a3f690ea Extracting 3B
 5858a3f690ea Extracting 3B
 5858a3f690ea Extracting 3B
 5858a3f690ea Extracting 3B
 5858a3f690ea Extracting 3B
 5858a3f690ea Extracting 3B
 5858a3f690ea Extracting 3B
 5858a3f690ea Extracting 3B
 5858a3f690ea Extracting 4B
 5858a3f690ea Extracting 4B
 5858a3f690ea Extracting 4B
 5858a3f690ea Extracting 4B
 5858a3f690ea Extracting 4B
 5858a3f690ea Extracting 4B
 5858a3f690ea Extracting 4B
 5858a3f690ea Extracting 4B
 5858a3f690ea Extracting 4B
 5858a3f690ea Extracting 4B
 5858a3f690ea Pull complete 0B
 75de48f507ff Pull complete 0B
 b36c1b75fdb7 Pull complete 0B
 d884d6f49732 Pull complete 0B
 f070a6577866 Pull complete 0B
 7f3590dcd843 Pull complete 0B
 Image postgres:17-alpine Pulled 
 Image ads-cenario-2-frontend Building 
 Image ads-cenario-2-api Building 
#1 [internal] load local bake definitions
#1 reading from stdin 1.56kB 0.0s done
#1 DONE 0.0s

#2 [frontend internal] load build definition from Dockerfile
#2 transferring dockerfile: 155B 0.0s done
#2 DONE 0.0s

#3 [api internal] load build definition from Dockerfile
#3 transferring dockerfile: 155B 0.0s done
#3 DONE 0.1s

#4 [api internal] load metadata for docker.io/library/node:22-alpine
#4 ...

#5 [auth] library/node:pull token for registry-1.docker.io
#5 DONE 0.0s

#4 [api internal] load metadata for docker.io/library/node:22-alpine
#4 DONE 1.1s

#6 [frontend internal] load .dockerignore
#6 transferring context: 2B done
#6 DONE 0.0s

#7 [api internal] load .dockerignore
#7 transferring context: 2B done
#7 DONE 0.0s

#8 [api internal] load build context
#8 transferring context: 4.38kB 0.1s done
#8 DONE 0.1s

#9 [api 1/5] FROM docker.io/library/node:22-alpine@sha256:c610fcdfb1d5b4740dd70c284ed3cb16bb857e0f7166196e36a5501df7a3aa32
#9 resolve docker.io/library/node:22-alpine@sha256:c610fcdfb1d5b4740dd70c284ed3cb16bb857e0f7166196e36a5501df7a3aa32 0.1s done
#9 DONE 0.1s

#10 [frontend internal] load build context
#10 transferring context: 3.04kB 0.1s done
#10 DONE 0.1s

#11 [api 2/5] WORKDIR /app
#11 CACHED

#12 [api 3/5] COPY package*.json ./
#12 ...

#13 [frontend 3/5] COPY package*.json ./
#13 DONE 0.5s

#12 [api 3/5] COPY package*.json ./
#12 DONE 0.5s

#14 [api 4/5] RUN npm install
#14 9.241 
#14 9.241 added 96 packages, and audited 97 packages in 9s
#14 9.241 
#14 9.241 16 packages are looking for funding
#14 9.241   run `npm fund` for details
#14 9.246 
#14 9.246 found 0 vulnerabilities
#14 9.248 npm notice
#14 9.248 npm notice New major version of npm available! 10.9.8 -> 12.0.2
#14 9.248 npm notice Changelog: https://github.com/npm/cli/releases/tag/v12.0.2
#14 9.248 npm notice To update run: npm install -g npm@12.0.2
#14 9.248 npm notice
#14 DONE 9.6s

#15 [frontend 4/5] RUN npm install
#15 ...

#16 [api 5/5] COPY . .
#16 DONE 0.1s

#17 [api] exporting to image
#17 exporting layers
#17 exporting layers 1.0s done
#17 exporting manifest sha256:5bb0ea86db448a981f25e1d43df42e7b693389439c50d3cfc5e36a39dab28457 0.0s done
#17 exporting config sha256:0a86c9a2f4e333ed82a53db1e336b2761459a94b8b327848c96dc66517b7088d 0.0s done
#17 exporting attestation manifest sha256:db573d98b5ec7d556d7e72466bdf34661a45eabc5c6e581c53b0e78b0a5fa355 0.0s done
#17 exporting manifest list sha256:d404177be79fe0c05d9693bc3ae553e0a1168df583e38af7251384049416bf6a
#17 exporting manifest list sha256:d404177be79fe0c05d9693bc3ae553e0a1168df583e38af7251384049416bf6a 0.0s done
#17 naming to docker.io/library/ads-cenario-2-api:latest done
#17 unpacking to docker.io/library/ads-cenario-2-api:latest
#17 unpacking to docker.io/library/ads-cenario-2-api:latest 1.8s done
#17 DONE 3.2s

#15 [frontend 4/5] RUN npm install
#15 ...

#18 [api] resolving provenance for metadata file
#18 DONE 0.0s

#15 [frontend 4/5] RUN npm install
#15 19.02 
#15 19.02 added 62 packages, and audited 63 packages in 19s
#15 19.02 
#15 19.02 7 packages are looking for funding
#15 19.02   run `npm fund` for details
#15 19.03 
#15 19.03 2 vulnerabilities (1 moderate, 1 high)
#15 19.03 
#15 19.03 To address all issues (including breaking changes), run:
#15 19.03   npm audit fix --force
#15 19.03 
#15 19.03 Run `npm audit` for details.
#15 19.04 npm notice
#15 19.04 npm notice New major version of npm available! 10.9.8 -> 12.0.2
#15 19.04 npm notice Changelog: https://github.com/npm/cli/releases/tag/v12.0.2
#15 19.04 npm notice To update run: npm install -g npm@12.0.2
#15 19.04 npm notice
#15 DONE 19.3s

#19 [frontend 5/5] COPY . .
#19 DONE 0.1s

#20 [frontend] exporting to image
#20 exporting layers
#20 exporting layers 5.5s done
#20 exporting manifest sha256:26b21ec78b4aea5506a1d8f9b24582bec1bf2b1247861a7540afabe0bd1c8fea 0.0s done
#20 exporting config sha256:959f06a0fadf1b8887c30a9ddff642b3e35d89f8a9d93154fc4e6d6d700ac9e8 0.0s done
#20 exporting attestation manifest sha256:8e133a4b75cd3eb67a0eeffa087c08992a1eba7aaec5ba1c05193dc236138ba1 0.0s done
#20 exporting manifest list sha256:62851890e688295229e918edf860a20e0405fda1ac2953da57374d0ccffa34ec 0.0s done
#20 naming to docker.io/library/ads-cenario-2-frontend:latest
#20 naming to docker.io/library/ads-cenario-2-frontend:latest done
#20 unpacking to docker.io/library/ads-cenario-2-frontend:latest
#20 unpacking to docker.io/library/ads-cenario-2-frontend:latest 2.6s done
#20 DONE 8.3s

#21 [frontend] resolving provenance for metadata file
#21 DONE 0.0s
 Image ads-cenario-2-api Built 
 Image ads-cenario-2-frontend Built 
 Network ads-cenario-2_app_net Creating 
 Network ads-cenario-2_app_net Creating 
 Volume ads-cenario-2_api_node_modules Creating 
 Volume ads-cenario-2_api_node_modules Creating 
 Volume ads-cenario-2_postgres_data Creating 
 Volume ads-cenario-2_react_node_modules Creating 
 Volume ads-cenario-2_react_node_modules Creating 
 Volume ads-cenario-2_postgres_data Creating 
 Volume ads-cenario-2_api_node_modules Created 
 Volume ads-cenario-2_api_node_modules Created 
 Volume ads-cenario-2_react_node_modules Created 
 Volume ads-cenario-2_react_node_modules Created 
 Volume ads-cenario-2_postgres_data Created 
 Volume ads-cenario-2_postgres_data Created 
 Network ads-cenario-2_app_net Created 
 Network ads-cenario-2_app_net Created 
 Container ads-cenario-2-redis-1 Creating 
 Container ads-cenario-2-rabbitmq-1 Creating 
 Container ads-cenario-2-frontend-1 Creating 
 Container ads-cenario-2-postgres-1 Creating 
 Container ads-cenario-2-redis-1 Created 
 Container ads-cenario-2-postgres-1 Created 
 Container ads-cenario-2-rabbitmq-1 Created 
 Container ads-cenario-2-api-1 Creating 
 Container ads-cenario-2-api-1 Created 
 Container ads-cenario-2-frontend-1 Created 
 Container ads-cenario-2-proxy-1 Creating 
 Container ads-cenario-2-proxy-1 Created 
 Container ads-cenario-2-rabbitmq-1 Starting 
 Container ads-cenario-2-postgres-1 Starting 
 Container ads-cenario-2-redis-1 Starting 
 Container ads-cenario-2-frontend-1 Starting 
 Container ads-cenario-2-redis-1 Started 
 Container ads-cenario-2-postgres-1 Started 
 Container ads-cenario-2-rabbitmq-1 Started 
 Container ads-cenario-2-postgres-1 Waiting 
 Container ads-cenario-2-rabbitmq-1 Waiting 
 Container ads-cenario-2-frontend-1 Started 
 Container ads-cenario-2-postgres-1 Healthy 
 Container ads-cenario-2-rabbitmq-1 Healthy 
 Container ads-cenario-2-api-1 Starting 
 Container ads-cenario-2-api-1 Started 
 Container ads-cenario-2-proxy-1 Starting 
 Container ads-cenario-2-proxy-1 Started 
```

Aguardando postgres e rabbitmq ficarem healthy (até 90s)...

## 2. `docker compose ps`

```
NAME                       IMAGE                    COMMAND                  SERVICE    CREATED          STATUS                    PORTS
ads-cenario-2-api-1        ads-cenario-2-api        "docker-entrypoint.s…"   api        19 seconds ago   Up 3 seconds              3000/tcp
ads-cenario-2-frontend-1   ads-cenario-2-frontend   "docker-entrypoint.s…"   frontend   19 seconds ago   Up 16 seconds             5173/tcp
ads-cenario-2-postgres-1   postgres:17-alpine       "docker-entrypoint.s…"   postgres   19 seconds ago   Up 17 seconds (healthy)   5432/tcp
ads-cenario-2-proxy-1      nginx:1.27-alpine        "/docker-entrypoint.…"   proxy      17 seconds ago   Up 2 seconds              0.0.0.0:8080->80/tcp, [::]:8080->80/tcp
ads-cenario-2-rabbitmq-1   rabbitmq:4-management    "docker-entrypoint.s…"   rabbitmq   19 seconds ago   Up 16 seconds (healthy)   0.0.0.0:15673->15672/tcp, [::]:15673->15672/tcp
ads-cenario-2-redis-1      redis:7.4-alpine         "docker-entrypoint.s…"   redis      19 seconds ago   Up 17 seconds             6379/tcp
```

## 3. Acessando a aplicação via proxy (`http://localhost:8080`)

```
$ curl -sS -o /dev/null -w 'GET /        -> HTTP %{http_code}\n' http://localhost:8080/
GET /        -> HTTP 200
$ curl -sS http://localhost:8080/api/health
{"status":"ok"}
$ curl -sS http://localhost:8080/api/status
{"postgres":{"ok":true,"totalEventos":1},"redis":{"ok":true,"valor":"2026-08-28T17:44:04.898Z"},"rabbitmq":{"ok":true,"fila":"cenario2.eventos"}}```

## 4. Subindo o pgAdmin com o profile `tools` (atividade parcial 7.4)

```
$ docker compose --profile tools up -d
 Image dpage/pgadmin4:8 Pulling 
 609a99bd4f87 Pulling fs layer 0B
 dcd3056dbb91 Pulling fs layer 0B
 6db836a75a2d Pulling fs layer 0B
 5d0e4706d110 Pulling fs layer 0B
 31ebcef82521 Pulling fs layer 0B
 91551c39a7c3 Pulling fs layer 0B
 210d55276a54 Pulling fs layer 0B
 0f3a11d54a10 Pulling fs layer 0B
 1213e95defdb Pulling fs layer 0B
 545d1f431f52 Pulling fs layer 0B
 087843ea2956 Pulling fs layer 0B
 48449e1741e8 Pulling fs layer 0B
 31af12c6548e Pulling fs layer 0B
 38a8310d387e Pulling fs layer 0B
 55c17a7b26f0 Pulling fs layer 0B
 93a2e5af292e Pulling fs layer 0B
 609a99bd4f87 Downloading 1.049MB
 609a99bd4f87 Downloading 2.097MB
 609a99bd4f87 Downloading 3.146MB
 609a99bd4f87 Downloading 4.194MB
 609a99bd4f87 Downloading 5.243MB
 6db836a75a2d Downloading 1.049MB
 609a99bd4f87 Downloading 5.243MB
 6db836a75a2d Downloading 1.049MB
 609a99bd4f87 Downloading 6.291MB
 dcd3056dbb91 Downloading 1.049MB
 6db836a75a2d Downloading 2.097MB
 609a99bd4f87 Downloading 7.34MB
 dcd3056dbb91 Downloading 2.097MB
 6db836a75a2d Downloading 2.097MB
 609a99bd4f87 Downloading 7.34MB
 dcd3056dbb91 Downloading 2.097MB
 6db836a75a2d Downloading 3.146MB
 dcd3056dbb91 Downloading 3.146MB
 6db836a75a2d Downloading 3.816MB
 609a99bd4f87 Downloading 8.389MB
 dcd3056dbb91 Downloading 3.146MB
 6db836a75a2d Download complete 0B
 609a99bd4f87 Downloading 9.437MB
 dcd3056dbb91 Downloading 4.194MB
 609a99bd4f87 Downloading 9.437MB
 dcd3056dbb91 Downloading 5.243MB
 31ebcef82521 Download complete 0B
 609a99bd4f87 Downloading 10.49MB
 609a99bd4f87 Downloading 11.53MB
 dcd3056dbb91 Downloading 5.243MB
 609a99bd4f87 Downloading 12.58MB
 5d0e4706d110 Downloading 169.1kB
 dcd3056dbb91 Downloading 6.291MB
 609a99bd4f87 Downloading 12.58MB
 5d0e4706d110 Download complete 0B
 dcd3056dbb91 Downloading 7.34MB
 dcd3056dbb91 Downloading 7.34MB
 609a99bd4f87 Downloading 13.63MB
 91551c39a7c3 Download complete 0B
 609a99bd4f87 Downloading 13.63MB
 dcd3056dbb91 Downloading 7.34MB
 609a99bd4f87 Downloading 14.68MB
 dcd3056dbb91 Downloading 8.877MB
 0f3a11d54a10 Download complete 0B
 609a99bd4f87 Downloading 15.73MB
 1213e95defdb Download complete 0B
 dcd3056dbb91 Download complete 0B
 609a99bd4f87 Downloading 16.78MB
 210d55276a54 Download complete 0B
 609a99bd4f87 Downloading 17.83MB
 609a99bd4f87 Downloading 18.87MB
 609a99bd4f87 Downloading 18.87MB
 545d1f431f52 Downloading 1.049MB
 609a99bd4f87 Downloading 19.92MB
 545d1f431f52 Downloading 1.049MB
 545d1f431f52 Downloading 1.049MB
 609a99bd4f87 Downloading 19.92MB
 087843ea2956 Downloading 1.049MB
 087843ea2956 Downloading 1.049MB
 545d1f431f52 Downloading 2.097MB
 609a99bd4f87 Downloading 21.22MB
 545d1f431f52 Downloading 3.146MB
 609a99bd4f87 Downloading 21.22MB
 087843ea2956 Downloading 2.097MB
 087843ea2956 Downloading 3.146MB
 545d1f431f52 Downloading 4.194MB
 609a99bd4f87 Downloading 21.22MB
 545d1f431f52 Downloading 4.194MB
 609a99bd4f87 Download complete 0B
 48449e1741e8 Download complete 0B
 087843ea2956 Downloading 4.194MB
 087843ea2956 Downloading 4.194MB
 545d1f431f52 Downloading 4.194MB
 545d1f431f52 Downloading 5.243MB
 31af12c6548e Download complete 0B
 087843ea2956 Downloading 5.243MB
 545d1f431f52 Downloading 5.243MB
 087843ea2956 Downloading 5.243MB
 55c17a7b26f0 Download complete 0B
 087843ea2956 Downloading 6.291MB
 545d1f431f52 Downloading 6.291MB
 087843ea2956 Downloading 7.34MB
 545d1f431f52 Downloading 7.34MB
 087843ea2956 Downloading 7.34MB
 545d1f431f52 Downloading 7.34MB
 087843ea2956 Downloading 7.34MB
 545d1f431f52 Downloading 8.389MB
 38a8310d387e Downloading 1.049MB
 545d1f431f52 Downloading 8.389MB
 38a8310d387e Downloading 1.049MB
 087843ea2956 Downloading 8.389MB
 545d1f431f52 Downloading 9.437MB
 38a8310d387e Downloading 2.097MB
 087843ea2956 Downloading 8.389MB
 545d1f431f52 Downloading 9.437MB
 38a8310d387e Downloading 2.097MB
 087843ea2956 Downloading 9.437MB
 087843ea2956 Downloading 9.437MB
 545d1f431f52 Downloading 10.49MB
 38a8310d387e Downloading 2.097MB
 087843ea2956 Downloading 9.437MB
 545d1f431f52 Downloading 10.49MB
 38a8310d387e Downloading 3.146MB
 545d1f431f52 Downloading 11.53MB
 38a8310d387e Downloading 3.644MB
 087843ea2956 Downloading 10.49MB
 545d1f431f52 Downloading 12.58MB
 38a8310d387e Download complete 0B
 087843ea2956 Downloading 11.53MB
 38a8310d387e Extracting 1B
 545d1f431f52 Downloading 12.58MB
 93a2e5af292e Download complete 0B
 087843ea2956 Downloading 11.53MB
 38a8310d387e Extracting 1B
 087843ea2956 Downloading 12.58MB
 545d1f431f52 Downloading 13.63MB
 38a8310d387e Extracting 1B
 087843ea2956 Downloading 12.58MB
 545d1f431f52 Downloading 14.68MB
 38a8310d387e Extracting 1B
 545d1f431f52 Downloading 15.73MB
 087843ea2956 Downloading 13.63MB
 38a8310d387e Extracting 1B
 087843ea2956 Downloading 14.68MB
 545d1f431f52 Downloading 15.73MB
 38a8310d387e Extracting 1B
 545d1f431f52 Downloading 16.78MB
 087843ea2956 Downloading 15.73MB
 38a8310d387e Extracting 1B
 087843ea2956 Downloading 15.73MB
 545d1f431f52 Downloading 17.83MB
 38a8310d387e Extracting 1B
 545d1f431f52 Downloading 17.83MB
 087843ea2956 Downloading 16.78MB
 38a8310d387e Extracting 1B
 545d1f431f52 Downloading 18.87MB
 087843ea2956 Downloading 17.83MB
 38a8310d387e Extracting 1B
 545d1f431f52 Downloading 19.92MB
 087843ea2956 Downloading 18.87MB
 38a8310d387e Extracting 1B
 087843ea2956 Downloading 19.92MB
 545d1f431f52 Downloading 20.97MB
 38a8310d387e Extracting 2B
 087843ea2956 Downloading 19.92MB
 545d1f431f52 Downloading 22.02MB
 38a8310d387e Extracting 2B
 087843ea2956 Downloading 20.97MB
 545d1f431f52 Downloading 23.07MB
 38a8310d387e Extracting 2B
 545d1f431f52 Downloading 24.12MB
 087843ea2956 Downloading 20.97MB
 38a8310d387e Extracting 2B
 087843ea2956 Downloading 22.02MB
 545d1f431f52 Downloading 24.12MB
 38a8310d387e Extracting 2B
 087843ea2956 Downloading 23.07MB
 545d1f431f52 Downloading 25.17MB
 38a8310d387e Extracting 2B
 545d1f431f52 Downloading 26.21MB
 087843ea2956 Downloading 23.07MB
 38a8310d387e Extracting 2B
 545d1f431f52 Downloading 26.21MB
 ecc706ea53f9 Downloading 2.112kB
 087843ea2956 Downloading 24.12MB
 38a8310d387e Pull complete 0B
 545d1f431f52 Downloading 27.26MB
 ecc706ea53f9 Download complete 0B
 087843ea2956 Downloading 24.12MB
 545d1f431f52 Downloading 27.26MB
 087843ea2956 Downloading 25.17MB
 087843ea2956 Downloading 25.17MB
 545d1f431f52 Downloading 28.31MB
 545d1f431f52 Downloading 29.36MB
 087843ea2956 Downloading 26.21MB
 545d1f431f52 Downloading 30.41MB
 087843ea2956 Downloading 26.21MB
 087843ea2956 Downloading 27.26MB
 545d1f431f52 Downloading 30.98MB
 087843ea2956 Downloading 28.31MB
 545d1f431f52 Downloading 30.98MB
 545d1f431f52 Downloading 30.98MB
 087843ea2956 Downloading 29.36MB
 087843ea2956 Downloading 30.41MB
 545d1f431f52 Downloading 30.98MB
 087843ea2956 Downloading 32.51MB
 545d1f431f52 Download complete 0B
 087843ea2956 Downloading 33.55MB
 087843ea2956 Downloading 34.6MB
 087843ea2956 Downloading 35.65MB
 087843ea2956 Downloading 36.7MB
 087843ea2956 Downloading 38.8MB
 087843ea2956 Downloading 39.85MB
 087843ea2956 Downloading 39.85MB
 087843ea2956 Downloading 40.89MB
 087843ea2956 Downloading 41.94MB
 087843ea2956 Downloading 42.99MB
 087843ea2956 Downloading 44.04MB
 087843ea2956 Downloading 45.09MB
 087843ea2956 Downloading 46.14MB
 087843ea2956 Downloading 47.19MB
 087843ea2956 Downloading 48.23MB
 087843ea2956 Downloading 49.28MB
 087843ea2956 Downloading 50.33MB
 087843ea2956 Downloading 50.33MB
 087843ea2956 Downloading 51.38MB
 087843ea2956 Downloading 52.43MB
 087843ea2956 Downloading 53.48MB
 087843ea2956 Downloading 54.53MB
 087843ea2956 Downloading 55.57MB
 087843ea2956 Downloading 55.57MB
 087843ea2956 Downloading 56.62MB
 087843ea2956 Downloading 57.67MB
 087843ea2956 Downloading 57.67MB
 087843ea2956 Downloading 58.72MB
 087843ea2956 Downloading 59.77MB
 087843ea2956 Downloading 59.77MB
 087843ea2956 Downloading 61.87MB
 087843ea2956 Downloading 61.87MB
 087843ea2956 Downloading 62.91MB
 087843ea2956 Downloading 63.96MB
 087843ea2956 Downloading 65.01MB
 087843ea2956 Downloading 66.06MB
 087843ea2956 Downloading 67.11MB
 087843ea2956 Downloading 68.16MB
 087843ea2956 Downloading 69.21MB
 087843ea2956 Downloading 70.25MB
 087843ea2956 Downloading 71.3MB
 087843ea2956 Downloading 72.35MB
 087843ea2956 Downloading 74.45MB
 087843ea2956 Downloading 75.5MB
 087843ea2956 Downloading 76.55MB
 087843ea2956 Downloading 78.64MB
 087843ea2956 Downloading 79.69MB
 087843ea2956 Downloading 80.74MB
 087843ea2956 Downloading 81.79MB
 087843ea2956 Downloading 82.84MB
 087843ea2956 Downloading 83.89MB
 087843ea2956 Downloading 84.93MB
 087843ea2956 Downloading 87.03MB
 087843ea2956 Downloading 88.08MB
 087843ea2956 Downloading 89.13MB
 087843ea2956 Downloading 90.18MB
 087843ea2956 Downloading 91.23MB
 087843ea2956 Downloading 92.27MB
 087843ea2956 Downloading 94.37MB
 087843ea2956 Downloading 95.42MB
 087843ea2956 Downloading 96.47MB
 087843ea2956 Downloading 97.52MB
 087843ea2956 Downloading 98.57MB
 087843ea2956 Downloading 100.7MB
 087843ea2956 Downloading 101.2MB
 087843ea2956 Downloading 101.2MB
 087843ea2956 Downloading 101.2MB
 087843ea2956 Downloading 101.2MB
 087843ea2956 Downloading 101.2MB
 087843ea2956 Downloading 101.2MB
 087843ea2956 Downloading 101.2MB
 087843ea2956 Downloading 101.2MB
 087843ea2956 Downloading 101.2MB
 087843ea2956 Downloading 101.2MB
 087843ea2956 Downloading 101.2MB
 087843ea2956 Downloading 101.2MB
 087843ea2956 Downloading 101.2MB
 087843ea2956 Downloading 101.2MB
 087843ea2956 Download complete 0B
 087843ea2956 Extracting 1B
 087843ea2956 Extracting 1B
 087843ea2956 Extracting 1B
 087843ea2956 Extracting 1B
 087843ea2956 Extracting 1B
 087843ea2956 Extracting 1B
 087843ea2956 Extracting 1B
 087843ea2956 Extracting 1B
 087843ea2956 Extracting 1B
 087843ea2956 Extracting 1B
 087843ea2956 Extracting 1B
 087843ea2956 Extracting 2B
 087843ea2956 Extracting 2B
 087843ea2956 Extracting 2B
 087843ea2956 Extracting 2B
 087843ea2956 Extracting 2B
 087843ea2956 Extracting 2B
 087843ea2956 Extracting 2B
 087843ea2956 Extracting 2B
 087843ea2956 Extracting 2B
 087843ea2956 Extracting 2B
 087843ea2956 Extracting 3B
 087843ea2956 Extracting 3B
 087843ea2956 Extracting 3B
 087843ea2956 Extracting 3B
 087843ea2956 Extracting 3B
 087843ea2956 Extracting 3B
 087843ea2956 Extracting 3B
 087843ea2956 Extracting 3B
 087843ea2956 Extracting 3B
 087843ea2956 Extracting 3B
 087843ea2956 Extracting 4B
 087843ea2956 Extracting 4B
 087843ea2956 Extracting 4B
 087843ea2956 Extracting 4B
 087843ea2956 Extracting 4B
 087843ea2956 Extracting 4B
 087843ea2956 Extracting 4B
 087843ea2956 Extracting 4B
 087843ea2956 Extracting 4B
 087843ea2956 Extracting 4B
 087843ea2956 Extracting 5B
 087843ea2956 Extracting 5B
 087843ea2956 Extracting 5B
 087843ea2956 Extracting 5B
 087843ea2956 Extracting 5B
 087843ea2956 Extracting 5B
 087843ea2956 Extracting 5B
 087843ea2956 Extracting 5B
 087843ea2956 Extracting 5B
 087843ea2956 Extracting 5B
 087843ea2956 Extracting 6B
 087843ea2956 Extracting 6B
 087843ea2956 Extracting 6B
 087843ea2956 Extracting 6B
 087843ea2956 Extracting 6B
 087843ea2956 Extracting 6B
 087843ea2956 Extracting 6B
 087843ea2956 Extracting 6B
 087843ea2956 Extracting 6B
 087843ea2956 Extracting 6B
 087843ea2956 Extracting 7B
 087843ea2956 Extracting 7B
 087843ea2956 Extracting 7B
 087843ea2956 Extracting 7B
 087843ea2956 Extracting 7B
 087843ea2956 Extracting 7B
 087843ea2956 Extracting 7B
 087843ea2956 Extracting 7B
 087843ea2956 Extracting 7B
 087843ea2956 Extracting 7B
 087843ea2956 Extracting 8B
 087843ea2956 Extracting 8B
 087843ea2956 Extracting 8B
 087843ea2956 Extracting 8B
 087843ea2956 Extracting 8B
 087843ea2956 Extracting 8B
 087843ea2956 Extracting 8B
 087843ea2956 Extracting 8B
 087843ea2956 Extracting 8B
 087843ea2956 Extracting 8B
 087843ea2956 Extracting 9B
 087843ea2956 Extracting 9B
 087843ea2956 Extracting 9B
 087843ea2956 Extracting 9B
 087843ea2956 Extracting 9B
 087843ea2956 Extracting 9B
 087843ea2956 Extracting 9B
 087843ea2956 Extracting 9B
 087843ea2956 Extracting 9B
 087843ea2956 Extracting 9B
 087843ea2956 Extracting 10B
 087843ea2956 Extracting 10B
 087843ea2956 Extracting 10B
 087843ea2956 Extracting 10B
 087843ea2956 Extracting 10B
 087843ea2956 Pull complete 0B
 6db836a75a2d Extracting 1B
 6db836a75a2d Pull complete 0B
 5d0e4706d110 Pull complete 0B
 31ebcef82521 Pull complete 0B
 91551c39a7c3 Pull complete 0B
 0f3a11d54a10 Extracting 1B
 210d55276a54 Pull complete 0B
 0f3a11d54a10 Pull complete 0B
 dcd3056dbb91 Extracting 1B
 dcd3056dbb91 Extracting 1B
 dcd3056dbb91 Extracting 1B
 dcd3056dbb91 Extracting 1B
 dcd3056dbb91 Extracting 1B
 dcd3056dbb91 Extracting 1B
 dcd3056dbb91 Extracting 1B
 dcd3056dbb91 Extracting 1B
 dcd3056dbb91 Extracting 1B
 dcd3056dbb91 Extracting 1B
 dcd3056dbb91 Extracting 1B
 dcd3056dbb91 Extracting 2B
 dcd3056dbb91 Extracting 2B
 dcd3056dbb91 Extracting 2B
 dcd3056dbb91 Extracting 2B
 dcd3056dbb91 Extracting 2B
 dcd3056dbb91 Pull complete 0B
 545d1f431f52 Extracting 1B
 545d1f431f52 Extracting 1B
 545d1f431f52 Extracting 1B
 545d1f431f52 Extracting 1B
 545d1f431f52 Extracting 1B
 545d1f431f52 Extracting 1B
 545d1f431f52 Extracting 1B
 48449e1741e8 Pull complete 0B
 545d1f431f52 Pull complete 0B
 1213e95defdb Pull complete 0B
 31af12c6548e Extracting 1B
 55c17a7b26f0 Pull complete 0B
 609a99bd4f87 Extracting 1B
 31af12c6548e Pull complete 0B
 93a2e5af292e Pull complete 0B
 609a99bd4f87 Extracting 1B
 609a99bd4f87 Extracting 1B
 609a99bd4f87 Extracting 1B
 609a99bd4f87 Extracting 1B
 609a99bd4f87 Extracting 1B
 609a99bd4f87 Extracting 1B
 609a99bd4f87 Extracting 1B
 609a99bd4f87 Extracting 1B
 609a99bd4f87 Extracting 1B
 609a99bd4f87 Extracting 1B
 609a99bd4f87 Extracting 2B
 609a99bd4f87 Extracting 2B
 609a99bd4f87 Extracting 2B
 609a99bd4f87 Extracting 2B
 609a99bd4f87 Extracting 2B
 609a99bd4f87 Extracting 2B
 609a99bd4f87 Extracting 2B
 609a99bd4f87 Extracting 2B
 609a99bd4f87 Extracting 2B
 609a99bd4f87 Pull complete 0B
 Image dpage/pgadmin4:8 Pulled 
 Container ads-cenario-2-rabbitmq-1 Running 
 Container ads-cenario-2-frontend-1 Running 
 Container ads-cenario-2-api-1 Running 
 Container ads-cenario-2-redis-1 Running 
 Container ads-cenario-2-proxy-1 Recreate 
 Container ads-cenario-2-pgadmin-1 Creating 
 Container ads-cenario-2-postgres-1 Recreate 
 Container ads-cenario-2-pgadmin-1 Created 
 Container ads-cenario-2-proxy-1 Recreated 
 Container ads-cenario-2-postgres-1 Recreated 
 Container ads-cenario-2-postgres-1 Starting 
 Container ads-cenario-2-pgadmin-1 Starting 
 Container ads-cenario-2-pgadmin-1 Started 
 Container ads-cenario-2-postgres-1 Started 
 Container ads-cenario-2-rabbitmq-1 Waiting 
 Container ads-cenario-2-postgres-1 Waiting 
 Container ads-cenario-2-rabbitmq-1 Healthy 
 Container ads-cenario-2-postgres-1 Healthy 
 Container ads-cenario-2-proxy-1 Starting 
 Container ads-cenario-2-proxy-1 Started 
$ curl -sS -o /dev/null -w 'GET :5050 -> HTTP %{http_code}\n' http://localhost:5050
curl: (7) Failed to connect to localhost port 5050 after 2213 ms: Could not connect to server
GET :5050 -> HTTP 000
```

PgAdmin acessível em http://localhost:5050 (login: admin@local.test / admin, ver .env.example).

## 5. Logs da api

```
api-1  | 
api-1  | > cenario-2-api@1.0.0 dev
api-1  | > node src/index.js
api-1  | 
api-1  | API do Cenario 2 ouvindo na porta 3000
api-1  | Acessivel atraves do proxy Nginx em http://localhost:8080/api/health e /api/status
api-1  | [status] postgres: OK { ok: true, totalEventos: 1 }
api-1  | [status] redis: OK { ok: true, valor: '2026-08-28T17:44:04.898Z' }
api-1  | [status] rabbitmq: OK { ok: true, fila: 'cenario2.eventos' }
```

## 6. `docker compose ps` mostrando os serviços `healthy`

```
NAME                       IMAGE                    COMMAND                  SERVICE    CREATED              STATUS                        PORTS
ads-cenario-2-api-1        ads-cenario-2-api        "docker-entrypoint.s…"   api        About a minute ago   Up About a minute             3000/tcp
ads-cenario-2-frontend-1   ads-cenario-2-frontend   "docker-entrypoint.s…"   frontend   About a minute ago   Up About a minute             5173/tcp
ads-cenario-2-postgres-1   postgres:17-alpine       "docker-entrypoint.s…"   postgres   27 seconds ago       Up 16 seconds (healthy)       5432/tcp
ads-cenario-2-proxy-1      nginx:1.27-alpine        "/docker-entrypoint.…"   proxy      28 seconds ago       Up 5 seconds                  0.0.0.0:8080->80/tcp, [::]:8080->80/tcp
ads-cenario-2-rabbitmq-1   rabbitmq:4-management    "docker-entrypoint.s…"   rabbitmq   About a minute ago   Up About a minute (healthy)   0.0.0.0:15673->15672/tcp, [::]:15673->15672/tcp
ads-cenario-2-redis-1      redis:7.4-alpine         "docker-entrypoint.s…"   redis      About a minute ago   Up About a minute             6379/tcp
```
