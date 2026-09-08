# 11 - Atividade — containers não substituem boas práticas

Docker melhora a padronização do ambiente, mas não corrige automaticamente problemas de segurança ou de operação. Uma aplicação vulnerável continua vulnerável depois de ser containerizada.

A equipe ainda precisa atualizar dependências, proteger credenciais, controlar versões, reduzir permissões e evitar portas desnecessárias. Também deve acompanhar logs e utilizar verificações de saúde.

Um container pode estar com o processo ativo enquanto a API não consegue consultar o banco. Por isso, apenas enxergar o status “running” não garante que o sistema esteja realmente saudável.
