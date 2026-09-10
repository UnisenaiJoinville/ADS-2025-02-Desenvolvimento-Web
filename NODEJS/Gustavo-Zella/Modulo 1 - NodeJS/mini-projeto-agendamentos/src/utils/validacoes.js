function validarDataHora(data, hora) {
  if (typeof data !== 'string' || typeof hora !== 'string' || !data.trim() || !hora.trim()) {
    return 'Data e hora são obrigatórias.';
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(data) || !/^\d{2}:\d{2}$/.test(hora)) {
    return 'Data ou hora inválida.';
  }

  const [ano, mes, dia] = data.split('-').map(Number);
  const [horas, minutos] = hora.split(':').map(Number);
  const dataValida = new Date(Date.UTC(ano, mes - 1, dia));

  if (
    dataValida.getUTCFullYear() !== ano ||
    dataValida.getUTCMonth() !== mes - 1 ||
    dataValida.getUTCDate() !== dia ||
    horas > 23 ||
    minutos > 59
  ) {
    return 'Data ou hora inválida.';
  }

  const hoje = new Date();
  const inicioDeHoje = Date.UTC(hoje.getFullYear(), hoje.getMonth(), hoje.getDate());

  if (dataValida.getTime() < inicioDeHoje) {
    return 'A data do agendamento não pode estar no passado.';
  }

  return null;
}

function validarCampos(body) {
  const camposObrigatorios = ['nomeCliente', 'usuarioId', 'data', 'hora', 'servico'];

  for (const campo of camposObrigatorios) {
    const valor = body && body[campo];

    if (valor === undefined || valor === null || (typeof valor === 'string' && !valor.trim())) {
      return `O campo ${campo} é obrigatório.`;
    }
  }

  if (!Number.isInteger(Number(body.usuarioId)) || Number(body.usuarioId) <= 0) {
    return 'O campo usuarioId deve ser um número inteiro positivo.';
  }

  return null;
}

function validarConflito(agendamentos, usuarioId, data, hora) {
  const conflito = agendamentos.some((agendamento) => {
    return (
      Number(agendamento.usuarioId) === Number(usuarioId) &&
      agendamento.data === data &&
      agendamento.hora === hora
    );
  });

  if (conflito) {
    return 'Já existe um agendamento para esse usuário no mesmo horário e data.';
  }

  return null;
}

function validarServico(servico) {
  const servicosDesativados = ['servico desativado', 'cancelado', 'inativo'];

  if (typeof servico !== 'string' || !servico.trim()) {
    return 'O campo servico é obrigatório.';
  }

  if (servicosDesativados.includes(servico.trim().toLowerCase())) {
    return 'Esse serviço está desativado e não pode ser agendado.';
  }

  return null;
}

module.exports = {
  validarDataHora,
  validarCampos,
  validarConflito,
  validarServico
};
