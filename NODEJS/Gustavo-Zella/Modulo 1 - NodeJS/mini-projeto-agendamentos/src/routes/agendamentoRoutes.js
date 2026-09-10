const express = require('express');
const {
  listarAgendamentos,
  buscarAgendamentoPorId,
  cadastrarAgendamento,
  atualizarAgendamento,
  removerAgendamento
} = require('../controllers/agendamentoController');

const router = express.Router();

router.get('/', listarAgendamentos);
router.get('/:id', buscarAgendamentoPorId);
router.post('/', cadastrarAgendamento);
router.put('/:id', atualizarAgendamento);
router.delete('/:id', removerAgendamento);

module.exports = router;
