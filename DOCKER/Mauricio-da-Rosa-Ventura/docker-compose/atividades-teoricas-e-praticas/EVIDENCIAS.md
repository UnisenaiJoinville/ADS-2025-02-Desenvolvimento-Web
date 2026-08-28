# Evidência — atividades práticas P2 e P4 (seção 10.2 do material)

Gerado em: 2026-08-28 14:48:42 -0300

## P2 — `docker compose config` em cenario-1-vue-node-mysql

```
name: ads-cenario-1
services:
  api:
    build:
      context: C:\Users\Multipedidos\Documents\ADS-2025-02-Desenvolvimento-Web\repositorio-turma\DOCKER\Mauricio-da-Rosa-Ventura\docker-compose\cenario-1-vue-node-mysql\backend
      dockerfile: Dockerfile
    command:
      - npm
      - run
      - dev
    depends_on:
      mysql:
        condition: service_healthy
        required: true
      rabbitmq:
        condition: service_healthy
        required: true
      redis:
        condition: service_started
        required: true
    environment:
      DB_HOST: mysql
      DB_PORT: "3306"
      MYSQL_DATABASE: cenario1
      MYSQL_PASSWORD: troque-esta-senha
      MYSQL_ROOT_PASSWORD: troque-esta-senha-root
      MYSQL_USER: cenario1_user
      RABBITMQ_HOST: rabbitmq
      RABBITMQ_PASSWORD: troque-esta-senha
      RABBITMQ_PORT: "5672"
      RABBITMQ_USER: cenario1
      REDIS_HOST: redis
      REDIS_PORT: "6379"
    networks:
      app_net: null
    ports:
      - mode: ingress
        target: 3000
        published: "3000"
        protocol: tcp
    volumes:
      - type: bind
        source: C:\Users\Multipedidos\Documents\ADS-2025-02-Desenvolvimento-Web\repositorio-turma\DOCKER\Mauricio-da-Rosa-Ventura\docker-compose\cenario-1-vue-node-mysql\backend
        target: /app
        bind: {}
      - type: volume
        source: backend_node_modules
        target: /app/node_modules
        volume: {}
  frontend:
    build:
      context: C:\Users\Multipedidos\Documents\ADS-2025-02-Desenvolvimento-Web\repositorio-turma\DOCKER\Mauricio-da-Rosa-Ventura\docker-compose\cenario-1-vue-node-mysql\frontend
      dockerfile: Dockerfile
    command:
      - npm
      - run
      - dev
      - --
      - --host
      - 0.0.0.0
    depends_on:
      api:
        condition: service_started
        required: true
    networks:
      app_net: null
    ports:
      - mode: ingress
        target: 5173
        published: "5173"
        protocol: tcp
    volumes:
      - type: bind
        source: C:\Users\Multipedidos\Documents\ADS-2025-02-Desenvolvimento-Web\repositorio-turma\DOCKER\Mauricio-da-Rosa-Ventura\docker-compose\cenario-1-vue-node-mysql\frontend
        target: /app
        bind: {}
      - type: volume
        source: frontend_node_modules
        target: /app/node_modules
        volume: {}
  mysql:
    environment:
      MYSQL_DATABASE: cenario1
      MYSQL_PASSWORD: troque-esta-senha
      MYSQL_ROOT_PASSWORD: troque-esta-senha-root
      MYSQL_USER: cenario1_user
    healthcheck:
      test:
        - CMD
        - mysqladmin
        - ping
        - -h
        - localhost
      timeout: 5s
      interval: 10s
      retries: 10
    image: mysql:8.4
    networks:
      app_net: null
    ports:
      - mode: ingress
        target: 3306
        published: "3306"
        protocol: tcp
    volumes:
      - type: volume
        source: mysql_data
        target: /var/lib/mysql
        volume: {}
      - type: bind
        source: C:\Users\Multipedidos\Documents\ADS-2025-02-Desenvolvimento-Web\repositorio-turma\DOCKER\Mauricio-da-Rosa-Ventura\docker-compose\cenario-1-vue-node-mysql\database\init.sql
        target: /docker-entrypoint-initdb.d/init.sql
        read_only: true
        bind: {}
  rabbitmq:
    environment:
      RABBITMQ_DEFAULT_PASS: troque-esta-senha
      RABBITMQ_DEFAULT_USER: cenario1
    healthcheck:
      test:
        - CMD
        - rabbitmq-diagnostics
        - ping
      timeout: 5s
      interval: 10s
      retries: 10
    image: rabbitmq:4-management
    networks:
      app_net: null
    ports:
      - mode: ingress
        target: 5672
        published: "5672"
        protocol: tcp
      - mode: ingress
        target: 15672
        published: "15672"
        protocol: tcp
  redis:
    image: redis:7.4-alpine
    networks:
      app_net: null
    ports:
      - mode: ingress
        target: 6379
        published: "6379"
        protocol: tcp
    volumes:
      - type: volume
        source: redis_data
        target: /data
        volume: {}
  worker:
    build:
      context: C:\Users\Multipedidos\Documents\ADS-2025-02-Desenvolvimento-Web\repositorio-turma\DOCKER\Mauricio-da-Rosa-Ventura\docker-compose\cenario-1-vue-node-mysql\worker
      dockerfile: Dockerfile
    command:
      - npm
      - run
      - worker
    depends_on:
      mysql:
        condition: service_healthy
        required: true
      rabbitmq:
        condition: service_healthy
        required: true
    environment:
      DB_HOST: mysql
      DB_PORT: "3306"
      MYSQL_DATABASE: cenario1
      MYSQL_PASSWORD: troque-esta-senha
      MYSQL_ROOT_PASSWORD: troque-esta-senha-root
      MYSQL_USER: cenario1_user
      RABBITMQ_HOST: rabbitmq
      RABBITMQ_PASSWORD: troque-esta-senha
      RABBITMQ_PORT: "5672"
      RABBITMQ_USER: cenario1
      REDIS_HOST: redis
      REDIS_PORT: "6379"
    networks:
      app_net: null
networks:
  app_net:
    name: ads-cenario-1_app_net
volumes:
  backend_node_modules:
    name: ads-cenario-1_backend_node_modules
  frontend_node_modules:
    name: ads-cenario-1_frontend_node_modules
  mysql_data:
    name: ads-cenario-1_mysql_data
  redis_data:
    name: ads-cenario-1_redis_data
```

## P2 — `docker compose config` em cenario-2-react-express-postgres

```
name: ads-cenario-2
services:
  api:
    build:
      context: C:\Users\Multipedidos\Documents\ADS-2025-02-Desenvolvimento-Web\repositorio-turma\DOCKER\Mauricio-da-Rosa-Ventura\docker-compose\cenario-2-react-express-postgres\backend
      dockerfile: Dockerfile
    command:
      - npm
      - run
      - dev
    depends_on:
      postgres:
        condition: service_healthy
        required: true
      rabbitmq:
        condition: service_healthy
        required: true
      redis:
        condition: service_started
        required: true
    environment:
      DB_HOST: postgres
      DB_PORT: "5432"
      POSTGRES_DB: cenario2
      POSTGRES_PASSWORD: troque-esta-senha
      POSTGRES_USER: cenario2_user
      RABBITMQ_HOST: rabbitmq
      RABBITMQ_PASSWORD: troque-esta-senha
      RABBITMQ_PORT: "5672"
      RABBITMQ_USER: cenario2
      REDIS_HOST: redis
      REDIS_PORT: "6379"
    expose:
      - "3000"
    networks:
      app_net: null
    volumes:
      - type: bind
        source: C:\Users\Multipedidos\Documents\ADS-2025-02-Desenvolvimento-Web\repositorio-turma\DOCKER\Mauricio-da-Rosa-Ventura\docker-compose\cenario-2-react-express-postgres\backend
        target: /app
        bind: {}
      - type: volume
        source: api_node_modules
        target: /app/node_modules
        volume: {}
  frontend:
    build:
      context: C:\Users\Multipedidos\Documents\ADS-2025-02-Desenvolvimento-Web\repositorio-turma\DOCKER\Mauricio-da-Rosa-Ventura\docker-compose\cenario-2-react-express-postgres\frontend
      dockerfile: Dockerfile
    command:
      - npm
      - run
      - dev
      - --
      - --host
      - 0.0.0.0
    expose:
      - "5173"
    networks:
      app_net: null
    volumes:
      - type: bind
        source: C:\Users\Multipedidos\Documents\ADS-2025-02-Desenvolvimento-Web\repositorio-turma\DOCKER\Mauricio-da-Rosa-Ventura\docker-compose\cenario-2-react-express-postgres\frontend
        target: /app
        bind: {}
      - type: volume
        source: react_node_modules
        target: /app/node_modules
        volume: {}
  postgres:
    environment:
      POSTGRES_DB: cenario2
      POSTGRES_PASSWORD: troque-esta-senha
      POSTGRES_USER: cenario2_user
    healthcheck:
      test:
        - CMD-SHELL
        - pg_isready -U cenario2_user -d cenario2
      timeout: 5s
      interval: 10s
      retries: 10
    image: postgres:17-alpine
    networks:
      app_net: null
    volumes:
      - type: volume
        source: postgres_data
        target: /var/lib/postgresql/data
        volume: {}
      - type: bind
        source: C:\Users\Multipedidos\Documents\ADS-2025-02-Desenvolvimento-Web\repositorio-turma\DOCKER\Mauricio-da-Rosa-Ventura\docker-compose\cenario-2-react-express-postgres\database\init.sql
        target: /docker-entrypoint-initdb.d/init.sql
        read_only: true
        bind: {}
  proxy:
    depends_on:
      api:
        condition: service_started
        required: true
      frontend:
        condition: service_started
        required: true
    image: nginx:1.27-alpine
    networks:
      app_net: null
    ports:
      - mode: ingress
        target: 80
        published: "8080"
        protocol: tcp
    volumes:
      - type: bind
        source: C:\Users\Multipedidos\Documents\ADS-2025-02-Desenvolvimento-Web\repositorio-turma\DOCKER\Mauricio-da-Rosa-Ventura\docker-compose\cenario-2-react-express-postgres\nginx\default.conf
        target: /etc/nginx/conf.d/default.conf
        read_only: true
        bind: {}
  rabbitmq:
    environment:
      RABBITMQ_DEFAULT_PASS: troque-esta-senha
      RABBITMQ_DEFAULT_USER: cenario2
    healthcheck:
      test:
        - CMD
        - rabbitmq-diagnostics
        - ping
      timeout: 5s
      interval: 10s
      retries: 10
    image: rabbitmq:4-management
    networks:
      app_net: null
    ports:
      - mode: ingress
        target: 15672
        published: "15673"
        protocol: tcp
  redis:
    image: redis:7.4-alpine
    networks:
      app_net: null
networks:
  app_net:
    name: ads-cenario-2_app_net
volumes:
  api_node_modules:
    name: ads-cenario-2_api_node_modules
  postgres_data:
    name: ads-cenario-2_postgres_data
  react_node_modules:
    name: ads-cenario-2_react_node_modules
```

## P2 — `docker compose config` em cenario-3-consolidacao

```
name: ads-cenario-3
services:
  api:
    build:
      context: C:\Users\Multipedidos\Documents\ADS-2025-02-Desenvolvimento-Web\repositorio-turma\DOCKER\Mauricio-da-Rosa-Ventura\docker-compose\cenario-3-consolidacao\backend
      dockerfile: Dockerfile
    command:
      - npm
      - run
      - dev
    depends_on:
      postgres:
        condition: service_healthy
        required: true
      rabbitmq:
        condition: service_healthy
        required: true
      redis:
        condition: service_started
        required: true
    environment:
      DB_HOST: postgres
      DB_PORT: "5432"
      POSTGRES_DB: cenario3
      POSTGRES_PASSWORD: troque-esta-senha
      POSTGRES_USER: cenario3_user
      RABBITMQ_HOST: rabbitmq
      RABBITMQ_PASSWORD: troque-esta-senha
      RABBITMQ_PORT: "5672"
      RABBITMQ_USER: cenario3
      REDIS_HOST: redis
      REDIS_PORT: "6379"
    healthcheck:
      test:
        - CMD
        - node
        - -e
        - require('http').get('http://localhost:3000/health', r => process.exit(r.statusCode===200?0:1)).on('error',()=>process.exit(1))
      timeout: 5s
      interval: 10s
      retries: 10
    networks:
      app_net: null
    ports:
      - mode: ingress
        target: 3000
        published: "3001"
        protocol: tcp
    volumes:
      - type: bind
        source: C:\Users\Multipedidos\Documents\ADS-2025-02-Desenvolvimento-Web\repositorio-turma\DOCKER\Mauricio-da-Rosa-Ventura\docker-compose\cenario-3-consolidacao\backend
        target: /app
        bind: {}
      - type: volume
        source: backend_node_modules
        target: /app/node_modules
        volume: {}
  frontend:
    build:
      context: C:\Users\Multipedidos\Documents\ADS-2025-02-Desenvolvimento-Web\repositorio-turma\DOCKER\Mauricio-da-Rosa-Ventura\docker-compose\cenario-3-consolidacao\frontend
      dockerfile: Dockerfile
    command:
      - npm
      - run
      - dev
      - --
      - --host
      - 0.0.0.0
    depends_on:
      api:
        condition: service_started
        required: true
    networks:
      app_net: null
    ports:
      - mode: ingress
        target: 5173
        published: "5174"
        protocol: tcp
    volumes:
      - type: bind
        source: C:\Users\Multipedidos\Documents\ADS-2025-02-Desenvolvimento-Web\repositorio-turma\DOCKER\Mauricio-da-Rosa-Ventura\docker-compose\cenario-3-consolidacao\frontend
        target: /app
        bind: {}
      - type: volume
        source: frontend_node_modules
        target: /app/node_modules
        volume: {}
  postgres:
    environment:
      POSTGRES_DB: cenario3
      POSTGRES_PASSWORD: troque-esta-senha
      POSTGRES_USER: cenario3_user
    healthcheck:
      test:
        - CMD-SHELL
        - pg_isready -U cenario3_user -d cenario3
      timeout: 5s
      interval: 10s
      retries: 10
    image: postgres:17-alpine
    networks:
      app_net: null
    volumes:
      - type: volume
        source: postgres_data
        target: /var/lib/postgresql/data
        volume: {}
      - type: bind
        source: C:\Users\Multipedidos\Documents\ADS-2025-02-Desenvolvimento-Web\repositorio-turma\DOCKER\Mauricio-da-Rosa-Ventura\docker-compose\cenario-3-consolidacao\database\init.sql
        target: /docker-entrypoint-initdb.d/init.sql
        read_only: true
        bind: {}
  rabbitmq:
    environment:
      RABBITMQ_DEFAULT_PASS: troque-esta-senha
      RABBITMQ_DEFAULT_USER: cenario3
    healthcheck:
      test:
        - CMD
        - rabbitmq-diagnostics
        - ping
      timeout: 5s
      interval: 10s
      retries: 10
    image: rabbitmq:4-management
    networks:
      app_net: null
    ports:
      - mode: ingress
        target: 15672
        published: "15674"
        protocol: tcp
  redis:
    image: redis:7.4-alpine
    networks:
      app_net: null
    volumes:
      - type: volume
        source: redis_data
        target: /data
        volume: {}
  worker:
    build:
      context: C:\Users\Multipedidos\Documents\ADS-2025-02-Desenvolvimento-Web\repositorio-turma\DOCKER\Mauricio-da-Rosa-Ventura\docker-compose\cenario-3-consolidacao\worker
      dockerfile: Dockerfile
    command:
      - npm
      - run
      - worker
    depends_on:
      postgres:
        condition: service_healthy
        required: true
      rabbitmq:
        condition: service_healthy
        required: true
    environment:
      DB_HOST: postgres
      DB_PORT: "5432"
      POSTGRES_DB: cenario3
      POSTGRES_PASSWORD: troque-esta-senha
      POSTGRES_USER: cenario3_user
      RABBITMQ_HOST: rabbitmq
      RABBITMQ_PASSWORD: troque-esta-senha
      RABBITMQ_PORT: "5672"
      RABBITMQ_USER: cenario3
      REDIS_HOST: redis
      REDIS_PORT: "6379"
    networks:
      app_net: null
networks:
  app_net:
    name: ads-cenario-3_app_net
volumes:
  backend_node_modules:
    name: ads-cenario-3_backend_node_modules
  frontend_node_modules:
    name: ads-cenario-3_frontend_node_modules
  postgres_data:
    name: ads-cenario-3_postgres_data
  redis_data:
    name: ads-cenario-3_redis_data
```

## P4 — `docker compose exec api` no cenário 1

```
$ docker compose exec api sh -c "node -v && whoami && ls"
v22.23.2
root
Dockerfile
node_modules
package.json
src
```
