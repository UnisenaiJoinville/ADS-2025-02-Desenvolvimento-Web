# Evidencia de execucao - Atividade 19: Publicando uma imagem

Gerado em: 2026-08-28 14:24:21 -0300

## Comandos e saída

```
$ echo "--- publicando em um registry local (nao exige conta) ---"
--- publicando em um registry local (nao exige conta) ---

$ docker run -d -p 5000:5000 --name registro-local registry:2
Unable to find image 'registry:2' locally
2: Pulling from library/registry
6d464ea18732: Pulling fs layer
3493bf46cdec: Pulling fs layer
44cf07d57ee4: Pulling fs layer
8e82f80af0de: Pulling fs layer
bbbdd6c6894b: Pulling fs layer
bbbdd6c6894b: Download complete
3493bf46cdec: Download complete
6d464ea18732: Download complete
44cf07d57ee4: Download complete
8e82f80af0de: Download complete
44cf07d57ee4: Pull complete
32a76c78501f: Download complete
b537bf6d1146: Download complete
bbbdd6c6894b: Pull complete
3493bf46cdec: Pull complete
8e82f80af0de: Pull complete
6d464ea18732: Pull complete
Digest: sha256:a3d8aaa63ed8681a604f1dea0aa03f100d5895b6a58ace528858a7b332415373
Status: Downloaded newer image for registry:2
2a84e415872ef2ef5da6fca59723be0860936b3ea32c3635bb4981e01d6ab845

$ sleep 1

$ docker tag minha-imagem localhost:5000/minha-imagem:v1

$ docker push localhost:5000/minha-imagem:v1
The push refers to repository [localhost:5000/minha-imagem]
b387fb0b5400: Waiting
44136fa355b3: Waiting
f3db1cd94078: Waiting
06e9d71331fb: Waiting
f3db1cd94078: Waiting
06e9d71331fb: Waiting
b387fb0b5400: Waiting
44136fa355b3: Waiting
b387fb0b5400: Waiting
44136fa355b3: Waiting
f3db1cd94078: Waiting
06e9d71331fb: Waiting
44136fa355b3: Waiting
f3db1cd94078: Waiting
06e9d71331fb: Waiting
b387fb0b5400: Waiting
b387fb0b5400: Waiting
44136fa355b3: Waiting
f3db1cd94078: Waiting
06e9d71331fb: Waiting
b387fb0b5400: Waiting
44136fa355b3: Waiting
f3db1cd94078: Waiting
06e9d71331fb: Waiting
44136fa355b3: Pushed
f3db1cd94078: Pushed
b387fb0b5400: Pushed
06e9d71331fb: Pushed
55632b70767f: Pushed
v1: digest: sha256:a772c4029d007903c3b4ef0733a36ea44d7944a59bd2f919483672e1deec8924 size: 855

$ echo


$ echo "--- alternativa real no Docker Hub (opcional, exige conta): ---"
--- alternativa real no Docker Hub (opcional, exige conta): ---

$ echo "docker login"
docker login

$ echo "docker tag minha-imagem <seu-usuario>/minha-imagem:v1"
docker tag minha-imagem <seu-usuario>/minha-imagem:v1

$ echo "docker push <seu-usuario>/minha-imagem:v1"
docker push <seu-usuario>/minha-imagem:v1

```

