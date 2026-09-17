// Desafio — Serviço de agendamento em memória (seção 26.3)
//
// Objetivo: decompor a regra "não permitir conflito de horário para o mesmo
// profissional" em funções pequenas, puras e testáveis, sem HTTP e sem banco.

// ---------- "Banco" em memória ----------
const appointments = [];


function validateScheduleInput(input) {
  const professionalId = input?.professionalId;
  const serviceId = input?.serviceId;
  const startAt = input?.startAt ? new Date(input.startAt) : null;
  const durationMinutes = Number(input?.durationMinutes);

  if (!professionalId) throw new Error("professionalId é obrigatório");
  if (!serviceId) throw new Error("serviceId é obrigatório");
  if (!startAt || Number.isNaN(startAt.getTime())) {
    throw new Error("startAt inválido");
  }
  if (!Number.isInteger(durationMinutes) || durationMinutes <= 0) {
    throw new Error("durationMinutes deve ser um inteiro positivo");
  }

  return { professionalId, serviceId, startAt, durationMinutes };
}

function hasTimeConflict(newAppointment, existingAppointments) {
  const newStart = newAppointment.startAt.getTime();
  const newEnd = newStart + newAppointment.durationMinutes * 60_000;

  return existingAppointments.some((existing) => {
    if (existing.professionalId !== newAppointment.professionalId) {
      return false;
    }
    const existingStart = existing.startAt.getTime();
    const existingEnd = existingStart + existing.durationMinutes * 60_000;


    return newStart < existingEnd && existingStart < newEnd;
  });
}


function scheduleAppointment(input) {
  const data = validateScheduleInput(input);

  if (hasTimeConflict(data, appointments)) {
    throw new Error(
      `Conflito de horário: profissional ${data.professionalId} já possui um agendamento nesse período`,
    );
  }

  const appointment = {
    id: crypto.randomUUID(),
    ...data,
    createdAt: new Date().toISOString(),
  };
  appointments.push(appointment);
  return appointment;
}

function listAppointments() {
  return appointments.map((a) => ({ ...a }));
}


const input1 = {
  professionalId: "prof-1",
  serviceId: "service-1",
  startAt: "2026-09-10T14:00:00-03:00",
  durationMinutes: 45,
};

console.log("=== Agendamento 1 (deve funcionar) ===");
const appointment1 = scheduleAppointment(input1);
console.log(appointment1);

console.log("\n=== Agendamento 2: mesmo profissional, horário sobreposto (deve falhar) ===");
try {
  scheduleAppointment({
    professionalId: "prof-1",
    serviceId: "service-2",
    durationMinutes: 30,
  });
} catch (error) {
  console.error("Erro esperado:", error.message);
}

console.log("\n=== Agendamento 3: mesmo profissional, horário logo em seguida sem sobrepor (deve funcionar) ===");
const appointment3 = scheduleAppointment({
  professionalId: "prof-1",
  serviceId: "service-2",
  startAt: "2026-09-10T14:45:00-03:00", 
  durationMinutes: 30,
});
console.log(appointment3);

console.log("\n=== Agendamento 4: profissional diferente, mesmo horário (deve funcionar) ===");
const appointment4 = scheduleAppointment({
  professionalId: "prof-2",
  serviceId: "service-1",
  startAt: "2026-09-10T14:00:00-03:00",
  durationMinutes: 45,
});
console.log(appointment4);

console.log("\n=== Agendamento 5: duração inválida (deve falhar) ===");
try {
  scheduleAppointment({
    professionalId: "prof-1",
    serviceId: "service-1",
    startAt: "2026-09-11T09:00:00-03:00",
    durationMinutes: -10,
  });
} catch (error) {
  console.error("Erro esperado:", error.message);
}

console.log("\n=== Todos os agendamentos confirmados ===");
console.table(listAppointments().map(({ id, ...rest }) => rest));

/*
 * ---------- Respostas às questões de discussão ----------
 *
 * 1) Onde deveria ficar a regra de conflito?
 *    Na camada de caso de uso / serviço (aqui, dentro de scheduleAppointment,
 *    apoiada pela função pura hasTimeConflict). Não deve ficar no repositório
 *    nem no validador: o repositório só deve saber persistir e consultar dados,
 *    e o validador só cuida de formato. A regra de conflito é comportamento de
 *    domínio, então pertence à camada de serviço.
 *
 * 2) O repositório deve decidir se um horário é permitido?
 *    Não. O repositório pode expor uma consulta (ex: "traga os agendamentos
 *    desse profissional nesse intervalo"), mas quem decide se o horário é
 *    válido é a regra de negócio na camada de serviço. Se o repositório
 *    decidisse isso, ele ficaria acoplado a uma regra de negócio específica,
 *    dificultando reaproveitar o mesmo repositório para outra regra no futuro.
 *
 * 3) O que acontece quando existem duas requisições simultâneas?
 *    Com estado em memória e sem nenhum tipo de trava (lock), duas requisições
 *    concorrentes poderiam ler "nenhum conflito" ao mesmo tempo, e as duas
 *    conseguiriam inserir agendamentos sobrepostos (condição de corrida).
 *    Isso não é um problema puramente teórico — é exatamente o tipo de bug que
 *    aparece em produção sob carga. Bancos de dados relacionais resolvem isso
 *    com transações e constraints (ex: EXCLUDE constraint no PostgreSQL para
 *    impedir sobreposição de intervalos).
 *
 * 4) O que mudará quando o PostgreSQL for introduzido?
 *    - O repositório passará a fazer consultas SQL em vez de usar um array.
 *    - A verificação de conflito poderá (e deveria) ser reforçada com uma
 *      constraint no banco, além da checagem em código, para garantir
 *      consistência mesmo sob concorrência.
 *    - A regra de negócio (hasTimeConflict) e a validação de entrada
 *      (validateScheduleInput) NÃO deveriam precisar mudar — essa é
 *      justamente a vantagem de separar responsabilidades desde o início.
 */
