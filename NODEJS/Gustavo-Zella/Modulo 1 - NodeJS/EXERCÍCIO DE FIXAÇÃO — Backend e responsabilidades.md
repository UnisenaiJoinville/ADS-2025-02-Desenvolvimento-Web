1. Explique com suas palavras a diferença entre backend, API e banco de dados.

R: Backend é todo o processo por trás de um sistema que o usuário não vê. Banco de dados é onde se armazena os dados do sistema, e a API é usada pra comunicar o backend com o externo.

2. No domínio de agendamentos, escreva três regras que devem obrigatoriamente ser garantidas no backend.

R:

-Não aceitar mais de um agendamento do mesmo usuário no mesmo horário e mesma data
-Aceitar apenas horários e data validos, exemplos inválidos: 31/02/2025, 67/22/9999.  
-Cada usuário cadastrar sua própria agenda.

3. Classifique cada item como validação sintática ou regra de negócio: e-mail sem @; preço negativo; conflito de horário; CPF com quantidade errada de dígitos; serviço desativado sendo agendado.

R: 

e-mail sem @ -> validação sintática;

preço negativo -> validação sintática;

CPF com quantidade errada de dígitos -> validação sintática;

conflito de horário -> Regra de negócio;

serviço desativado sendo agendado -> regra de negócio.

