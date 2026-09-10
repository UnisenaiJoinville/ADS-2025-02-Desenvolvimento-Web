const agendamentos = require('../data/agendamentos');
const {
  validarCampos,
  validarDataHora,
  validarConflito,
  validarServico
} = require('../utils/validacoes');

function listarAgendamentos(req, res) {
  res.status(200).json(agendamentos);
}

function buscarAgendamentoPorId(req, res) {
  const id = Number(req.params.id);
  const agendamento = agendamentos.find((item) => item.id === id);

  if (!agendamento) {
    return res.status(404).json({ mensagem: 'Agendamento não encontrado.' });
  }

  return res.status(200).json(agendamento);
}

function cadastrarAgendamento(req, res) {
  const dados = req.body;

  const erroCampos = validarCampos(dados);
  if (erroCampos) {
    return res.status(400).json({ mensagem: erroCampos });
  }

  const erroDataHora = validarDataHora(dados.data, dados.hora);
  if (erroDataHora) {
    return res.status(400).json({ mensagem: erroDataHora });
  }

  const erroServico = validarServico(dados.servico);
  if (erroServico) {
    return res.status(400).json({ mensagem: erroServico });
  }

  const erroConflito = validarConflito(agendamentos, Number(dados.usuarioId), dados.data, dados.hora);
  if (erroConflito) {
    return res.status(409).json({ mensagem: erroConflito });
  }

  const novoAgendamento = {
    id: agendamentos.length ? agendamentos[agendamentos.length - 1].id + 1 : 1,
    nomeCliente: dados.nomeCliente,
    usuarioId: Number(dados.usuarioId),
    data: dados.data,
    hora: dados.hora,
    servico: dados.servico,
    status: 'pendente'
  };

  agendamentos.push(novoAgendamento);
  return res.status(201).json({ mensagem: 'Agendamento criado com sucesso.', agendamento: novoAgendamento });
}

function atualizarAgendamento(req, res) {
  const id = Number(req.params.id);
  const index = agendamentos.findIndex((item) => item.id === id);

  if (index === -1) {
    return res.status(404).json({ mensagem: 'Agendamento não encontrado.' });
  }

  const dados = req.body;

  if (dados.data !== undefined || dados.hora !== undefined) {
    const erroDataHora = validarDataHora(
      dados.data !== undefined ? dados.data : agendamentos[index].data,
      dados.hora !== undefined ? dados.hora : agendamentos[index].hora
    );
    if (erroDataHora) {
      return res.status(400).json({ mensagem: erroDataHora });
    }
  }

  if (dados.nomeCliente !== undefined && (typeof dados.nomeCliente !== 'string' || !dados.nomeCliente.trim())) {
    return res.status(400).json({ mensagem: 'O campo nomeCliente é obrigatório.' });
  }

  if (dados.usuarioId !== undefined && (!Number.isInteger(Number(dados.usuarioId)) || Number(dados.usuarioId) <= 0)) {
    return res.status(400).json({ mensagem: 'O campo usuarioId deve ser um número inteiro positivo.' });
  }

  if (dados.servico !== undefined) {
    const erroServico = validarServico(dados.servico);
    if (erroServico) {
      return res.status(400).json({ mensagem: erroServico });
    }
  }

  const novaData = dados.data || agendamentos[index].data;
  const novaHora = dados.hora || agendamentos[index].hora;
  const novoUsuarioId = dados.usuarioId !== undefined ? Number(dados.usuarioId) : agendamentos[index].usuarioId;

  const erroConflito = validarConflito(
    agendamentos.filter((item) => item.id !== id),
    novoUsuarioId,
    novaData,
    novaHora
  );

  if (erroConflito) {
    return res.status(409).json({ mensagem: erroConflito });
  }

  agendamentos[index] = {
    ...agendamentos[index],
    ...dados,
    usuarioId: novoUsuarioId,
    data: novaData,
    hora: novaHora
  };

  return res.status(200).json({ mensagem: 'Agendamento atualizado com sucesso.', agendamento: agendamentos[index] });
}

function removerAgendamento(req, res) {
  const id = Number(req.params.id);
  const index = agendamentos.findIndex((item) => item.id === id);

  if (index === -1) {
    return res.status(404).json({ mensagem: 'Agendamento não encontrado.' });
  }

  agendamentos.splice(index, 1);
  return res.status(200).json({ mensagem: 'Agendamento removido com sucesso.' });
}

module.exports = {
  listarAgendamentos,
  buscarAgendamentoPorId,
  cadastrarAgendamento,
  atualizarAgendamento,
  removerAgendamento
};
