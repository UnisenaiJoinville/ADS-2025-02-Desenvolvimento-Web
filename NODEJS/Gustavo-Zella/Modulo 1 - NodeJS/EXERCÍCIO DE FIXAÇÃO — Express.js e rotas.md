1. O que é o Express.js e por que ele é muito usado em Node.js?

R: O Express.js é um framework para Node.js que facilita a criação de APIs e aplicações web. Ele ajuda a organizar rotas, middlewares e respostas HTTP de forma simples e prática.

2. Explique a diferença entre rota e controller.

R:
- Rota: define a url e o método HTTP, como GET /usuarios.
- Controller: contém a lógica que será executada quando a rota for acessada.

3. Como você diferenciaria parâmetros de rota e query string em uma API?

R:
- Parâmetro de rota: faz parte do caminho da URL, como /usuarios/1.
- Query string: vem depois do ponto de interrogação, como /usuarios?ativo=true.

4. Se você tivesse que criar uma rota para cadastrar um agendamento, qual seria a estrutura básica da URL e do método HTTP?

R: O mais comum seria usar o método POST em uma rota como /agendamentos, porque estamos enviando dados para criar um novo agendamento.
