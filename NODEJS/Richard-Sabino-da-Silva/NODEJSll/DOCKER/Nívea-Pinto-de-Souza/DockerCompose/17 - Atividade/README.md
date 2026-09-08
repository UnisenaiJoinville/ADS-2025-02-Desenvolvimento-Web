# 17 - Atividade — Atividade teórica — Riscos de versionar .env real

## Resposta
Três riscos principais são: **(1)** vazamento de senhas, tokens e chaves para qualquer pessoa com acesso ao repositório; **(2)** permanência do segredo no histórico do Git mesmo após apagar o arquivo em um commit posterior; **(3)** uso indevido das credenciais em outros ambientes, APIs, bancos ou serviços, podendo gerar acesso não autorizado e custos.

O recomendado é versionar apenas `.env.example`, sem segredos reais, e manter `.env` no `.gitignore`.