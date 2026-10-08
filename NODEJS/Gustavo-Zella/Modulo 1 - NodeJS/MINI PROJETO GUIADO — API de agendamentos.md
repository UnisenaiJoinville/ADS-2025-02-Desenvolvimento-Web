1. Qual é o objetivo do mini projeto?

R: O objetivo é criar uma API para controlar agendamentos de clientes, com validação de dados e regras de negócio simples, como evitar conflito de horários e garantir que o cliente só agende em datas válidas.

2. Quais funcionalidades a API deve ter?

R:
- Cadastrar um agendamento.
- Listar todos os agendamentos.
- Buscar um agendamento por id.
- Atualizar um agendamento existente.
- Excluir um agendamento.
- Validar dados antes de salvar.

3. Quais regras de negócio devem ser implementadas?

R:
- Não permitir dois agendamentos no mesmo horário para o mesmo usuário.
- Validar se a data e a hora são válidas.
- Não aceitar campos vazios.
- Bloquear agendamentos para serviços desativados.
- Garantir que cada agendamento tenha cliente e serviço associados.

4. Qual estrutura de pastas pode ser usada no projeto?

R:
- src/
  - app.js
  - server.js
  - routes/
  - controllers/
  - services/
  - data/
  - utils/

5. Como a rota de cadastro pode ser pensada?

R: A rota principal pode ser POST /agendamentos. Ela recebe os dados do cliente, data, hora, serviço e valida tudo antes de salvar.

6. Como a validação pode ser feita no backend?

R: O backend deve verificar se os campos chegaram corretamente, se a data e a hora existem, se a data não está no passado e se não há conflito com outro agendamento do mesmo usuário.

7. Como testar a API?

R: Pode-se usar o Postman ou o Insomnia para enviar requisições HTTP e testar as rotas, além de verificar os códigos de resposta como 200, 201, 400 e 404.

8. Qual deve ser o fluxo básico da aplicação?

R:
- O cliente envia uma requisição para a API.
- A rota recebe a chamada.
- O controller chama a lógica de negócio.
- O serviço valida os dados.
- Se tudo estiver certo, salva o agendamento.
- A API responde com status e mensagem apropriada.

9. Qual é a entrega final esperada?

R: A entrega final é uma API funcional que aceita agendamentos, valida as regras de negócio e responde corretamente aos erros e às operações do CRUD, funcionando de forma organizada e reutilizável.

cd "caminho da pasta no computador"
npm install
npm start