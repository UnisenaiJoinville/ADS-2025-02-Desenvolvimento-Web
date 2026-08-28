# 12 - Atividade — Atividade teórica — Volume nomeado x bind mount

## Resposta
Um **volume nomeado** é gerenciado pelo Docker e é indicado para dados persistentes, especialmente bancos de dados, porque não depende de um caminho específico do host e sobrevive à recriação de containers. Exemplo: `postgres_data:/var/lib/postgresql/data`.

Um **bind mount** liga uma pasta do host diretamente ao container. É mais adequado em desenvolvimento para código-fonte, pois alterações locais ficam visíveis imediatamente e permitem hot reload. Exemplo: `./backend:/app`.

Em resumo: dados de serviço → volume nomeado; código em desenvolvimento → bind mount.