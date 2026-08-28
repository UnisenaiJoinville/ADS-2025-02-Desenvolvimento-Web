# Evidencia de execucao - Atividade 26: Usando Docker Secrets

Gerado em: 2026-08-28 14:25:17 -0300

## Comandos e saída

```
$ docker swarm init --advertise-addr 127.0.0.1 2>&1 | head -5
Swarm initialized: current node (bjejorrfzyi5zxubaplb1ale8) is now a manager.

To add a worker to this swarm, run the following command:

    docker swarm join --token SWMTKN-1-0yqxokq62v7oo2dmk8quf3ac5kihi0pxv2qzzcn02qoa6vyikl-6ytc0ryq0fo2ogbmvw2qoi6lo 127.0.0.1:2377

$ printf "minha-senha-super-secreta" | docker secret create minha-senha -
2uv1ez8gmnefhnzeqogejl9k8

$ docker secret ls
ID                          NAME          DRIVER    CREATED                  UPDATED
2uv1ez8gmnefhnzeqogejl9k8   minha-senha             Less than a second ago   Less than a second ago

$ docker service create --name servico-com-secret --secret minha-senha alpine sleep 3600
l6ykantk4d4suqpfuy0qddkra
overall progress: 0 out of 1 tasks
1/1:  
overall progress: 0 out of 1 tasks
overall progress: 0 out of 1 tasks
overall progress: 0 out of 1 tasks
overall progress: 0 out of 1 tasks
overall progress: 0 out of 1 tasks
overall progress: 0 out of 1 tasks
overall progress: 0 out of 1 tasks
overall progress: 0 out of 1 tasks
overall progress: 0 out of 1 tasks
overall progress: 0 out of 1 tasks
overall progress: 0 out of 1 tasks
overall progress: 0 out of 1 tasks
overall progress: 0 out of 1 tasks
overall progress: 0 out of 1 tasks
overall progress: 0 out of 1 tasks
overall progress: 0 out of 1 tasks
overall progress: 0 out of 1 tasks
overall progress: 0 out of 1 tasks
overall progress: 0 out of 1 tasks
overall progress: 0 out of 1 tasks
overall progress: 0 out of 1 tasks
overall progress: 0 out of 1 tasks
overall progress: 1 out of 1 tasks
verify: Waiting 6 seconds to verify that tasks are stable...
verify: Waiting 5 seconds to verify that tasks are stable...
verify: Waiting 5 seconds to verify that tasks are stable...
verify: Waiting 5 seconds to verify that tasks are stable...
verify: Waiting 5 seconds to verify that tasks are stable...
verify: Waiting 4 seconds to verify that tasks are stable...
verify: Waiting 4 seconds to verify that tasks are stable...
verify: Waiting 4 seconds to verify that tasks are stable...
verify: Waiting 4 seconds to verify that tasks are stable...
verify: Waiting 4 seconds to verify that tasks are stable...
verify: Waiting 3 seconds to verify that tasks are stable...
verify: Waiting 3 seconds to verify that tasks are stable...
verify: Waiting 3 seconds to verify that tasks are stable...
verify: Waiting 3 seconds to verify that tasks are stable...
verify: Waiting 2 seconds to verify that tasks are stable...
verify: Waiting 2 seconds to verify that tasks are stable...
verify: Waiting 2 seconds to verify that tasks are stable...
verify: Waiting 2 seconds to verify that tasks are stable...
verify: Waiting 1 seconds to verify that tasks are stable...
verify: Waiting 1 seconds to verify that tasks are stable...
verify: Waiting 1 seconds to verify that tasks are stable...
verify: Waiting 1 seconds to verify that tasks are stable...
verify: Waiting 1 seconds to verify that tasks are stable...
verify: Service l6ykantk4d4suqpfuy0qddkra converged

$ sleep 3

$ TASK_CONTAINER=$(docker ps --filter "label=com.docker.swarm.service.name=servico-com-secret" -q | head -1)

$ echo "Container da task: $TASK_CONTAINER"
Container da task: a76a40face43

$ docker exec "$TASK_CONTAINER" cat /run/secrets/minha-senha
cat: can't open 'C:/Program Files/Git/run/secrets/minha-senha': No such file or directory

$ echo


$ docker service rm servico-com-secret
servico-com-secret

$ docker secret rm minha-senha
minha-senha

$ docker swarm leave --force
Node left the swarm.

```

