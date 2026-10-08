# Módulo 1 - Exercícios de fixação


## Executar


```bash
npm start
```

Esse comando demonstra o catálogo e o agendamento. Para executar os demais
exercícios e o script de argumentos:

```bash
npm run exercicios
npm run cli -- "Consulta" 45
npm run atividade26
```

```bash
npm run dev
```

## Seção 23 - Catálogo de serviços

O projeto cadastra serviços com `id`, `name`, `durationMinutes`, `price`, `active`
e `createdAt`. Valida nome obrigatório, duração positiva e preço não negativo.
Normaliza espaços e impede nomes repetidos, ignorando maiúsculas/minúsculas.

O `app.js` cria oito serviços, desativa Retorno e mostra sete ativos com média
de R$ 128,57. Depois demonstra três erros intencionais:

1. Nome repetido: `Serviço com este nome já existe.`
2. Duração zero: `Duração deve ser um inteiro positivo.`
3. Preço negativo: `Preço deve ser um número maior ou igual a zero.`

## Seção 26.3 - Agendamento em memória

`scheduleAppointment` recebe `professionalId`, `serviceId`, `startAt` e
`durationMinutes`. Impede duração inválida e sobreposição de horários do mesmo
profissional. A demonstração usa data ISO com fuso, como no enunciado.

No exemplo, 14h-14h45 é aceito; outro profissional pode usar o mesmo horário;
um novo agendamento às 14h45 é permitido. Uma tentativa às 14h30 para o primeiro
profissional é recusada. A duração negativa também é recusada.

