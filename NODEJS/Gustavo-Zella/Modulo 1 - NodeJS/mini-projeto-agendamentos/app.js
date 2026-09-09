const express = require('express');
const agendamentoRoutes = require('./src/routes/agendamentoRoutes');

const app = express();

app.use(express.json());
app.use('/agendamentos', agendamentoRoutes);

app.get('/', (req, res) => {
  res.json({
    message: 'API de agendamentos funcionando!',
    endpoints: {
      listar: 'GET /agendamentos',
      buscar: 'GET /agendamentos/:id',
      cadastrar: 'POST /agendamentos',
      atualizar: 'PUT /agendamentos/:id',
      remover: 'DELETE /agendamentos/:id'
    }
  });
});

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ mensagem: 'Erro interno do servidor.' });
});

module.exports = app;
