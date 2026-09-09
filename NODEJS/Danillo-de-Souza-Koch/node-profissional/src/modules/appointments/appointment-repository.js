/**
 * Repositório de agendamentos em memória. Assim como em service-repository,
 * devolve sempre cópias e concentra a única referência mutável do módulo.
 */
const appointments = [];

export function save(appointment) {
  appointments.push(appointment);
  return { ...appointment };
}

export function findByProfessional(professionalId) {
  return appointments
    .filter((appointment) => appointment.professionalId === professionalId)
    .map((appointment) => ({ ...appointment }));
}

export function findAll() {
  return appointments.map((appointment) => ({ ...appointment }));
}
