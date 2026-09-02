# 17 - Atividade — riscos do `.env` no Git

1. **Vazamento de credenciais:** usuários, senhas, tokens e chaves podem ser visualizados por quem tiver acesso ao repositório.
2. **Registro permanente no histórico:** excluir o arquivo em um commit posterior não apaga automaticamente as versões antigas.
3. **Uso indevido das credenciais:** um segredo exposto pode dar acesso a banco, APIs ou infraestrutura.

O correto é manter `.env` ignorado pelo Git e disponibilizar somente `.env.example`, contendo os nomes das variáveis e valores fictícios.
