<div align="center">

# FisioLife

**Sistema web de gestão para clínicas de fisioterapia**

Projeto Individual · Análise e Desenvolvimento de Sistemas · UniSENAI Joinville/SC · 2026<br>
Aluno: **Thiago Soethe Paschoal**

<img src="https://raw.githubusercontent.com/thiagosoethe/FisioLife/main/screenshots/01-inicio.png" alt="Página inicial do FisioLife" width="820">

</div>

---

## 🔗 Links do projeto

| | Repositório | Acesso |
| --- | --- | --- |
| 🖼️ **Apresentação completa** (telas, funcionalidades, arquitetura, segurança e testes) | [github.com/thiagosoethe/FisioLife](https://github.com/thiagosoethe/FisioLife) | Público |
| 💻 **Código-fonte** | `github.com/thiagosoethe/FisioLife-codigo` | Privado (acesso liberado ao professor) |

> O código-fonte está em um repositório privado para proteger a propriedade intelectual do sistema. O professor tem acesso como colaborador para avaliação.

---

## Sobre o projeto

O **FisioLife** reúne em um único sistema web a rotina de uma clínica de fisioterapia: agendamento online, prontuário eletrônico, controle financeiro e relatórios. Cada perfil tem o seu portal:

| Perfil | O que faz no sistema |
| --- | --- |
| 🧑 **Paciente** | Vê os horários livres, marca e cancela consultas, entra na lista de espera e acompanha o próprio histórico |
| 🩺 **Fisioterapeuta** | Acompanha a agenda do turno, inicia e conclui atendimentos e registra evoluções e altas no prontuário |
| 🗂️ **Recepção** | Organiza a agenda de todos os profissionais, cadastra pacientes, lança pagamentos, controla o caixa e emite comprovantes |
| 🛡️ **Administrador** | Gerencia contas e permissões, consulta relatórios financeiros e de produtividade, exporta CSV e faz o backup do banco |

## Algumas telas

| Portal do fisioterapeuta | Relatório financeiro |
| :---: | :---: |
| <img src="https://raw.githubusercontent.com/thiagosoethe/FisioLife/main/screenshots/05-fisioterapeuta.png" alt="Portal do fisioterapeuta"> | <img src="https://raw.githubusercontent.com/thiagosoethe/FisioLife/main/screenshots/08-relatorio.png" alt="Relatório financeiro"> |

Todas as telas estão na [apresentação completa](https://github.com/thiagosoethe/FisioLife#telas-do-sistema).

## Requisitos obrigatórios atendidos

| Requisito | Onde está no FisioLife |
| --- | --- |
| Formulário mestre-detalhe | Pagamento com itens da tabela de serviços |
| Recuperação de senha por e-mail | Código temporário enviado por e-mail, válido por 15 minutos |
| Exportação de dados (CSV) | Contas, pagamentos e relatórios |
| Autenticação e perfis de acesso | 4 perfis com permissões próprias |

## Tecnologias

PHP 8.2 · MySQL/MariaDB (22 tabelas) · JavaScript · Bootstrap 5.3 · XAMPP · Git

## Qualidade

- ✅ 52 testes de integração aprovados: permissões, agendamento, prontuário, pagamentos, caixa, sessões e backup
- ✅ 10 testes de validação: datas, horários e CPF
- ✅ Senhas com hash bcrypt, proteção CSRF, consultas parametrizadas (PDO), limite de tentativas de login e auditoria de acessos

---

<sub>© 2026 Thiago Soethe Paschoal. Todos os direitos reservados. Este material não concede licença de uso, cópia ou comercialização do sistema.</sub>
