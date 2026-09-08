# 10 - Atividade — imagem e container

Uma imagem Docker é a base versionada que reúne os arquivos, runtime e dependências necessários para iniciar uma aplicação. Ela serve como modelo reutilizável.

O container é uma execução criada a partir dessa imagem. É possível iniciar vários containers usando exatamente a mesma imagem, mas cada um terá seu próprio processo e ciclo de vida.

Por exemplo, uma imagem `catalogo-api:1.0` pode originar duas instâncias da API sem que seja necessário construir o projeto novamente para cada execução.
