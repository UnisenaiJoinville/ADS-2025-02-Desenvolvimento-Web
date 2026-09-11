import {
  createService,
  listServices,
  listActiveServices,
  deactivateService,
  getActiveServicesSummary,
  searchServices,
  sortServicesByPrice,
} from './modules/services/service-service.js';
import { scheduleAppointment } from './modules/appointments/appointment-service.js';

// Seção 23: oito serviços de exemplo.
const examples = [
  { name: '  Consulta   inicial  ', durationMinutes: 45, price: 150 },
  { name: 'Retorno', durationMinutes: 30, price: 80 },
  { name: 'Avaliação física', durationMinutes: 60, price: 120 },
  { name: 'Fisioterapia', durationMinutes: 50, price: 180 },
  { name: 'Massagem', durationMinutes: 60, price: 160 },
  { name: 'Nutrição', durationMinutes: 45, price: 200 },
  { name: 'Orientação gratuita', durationMinutes: 15, price: 0 },
  { name: 'Pilates', durationMinutes: 50, price: 90 },
];

const created = examples.map((input) => createService(input));

console.log('TODOS OS SERVIÇOS');
console.table(listServices());

deactivateService(created[1].id);
console.log('SERVIÇOS ATIVOS (Retorno foi desativado)');
console.table(listActiveServices());

const summary = getActiveServicesSummary();
console.log(`Ativos: ${summary.count}; preço médio: R$ ${summary.averagePrice.toFixed(2)}`);

// Desafio profissional da seção 23.
console.log('BUSCA POR PARTE DO NOME: consulta');
console.table(searchServices('consulta'));
console.log('ORDENADOS POR PREÇO');
console.table(sortServicesByPrice());
console.log('Ordem original:', listServices().map((service) => service.name));

// Três erros intencionais solicitados no miniprojeto.
const invalidServices = [
  { name: 'CONSULTA INICIAL', durationMinutes: 45, price: 150 },
  { name: 'Duração inválida', durationMinutes: 0, price: 30 },
  { name: 'Preço inválido', durationMinutes: 30, price: -1 },
];

for (const input of invalidServices) {
  try {
    createService(input);
  } catch (error) {
    console.log('Erro intencional do catálogo:', error.message);
  }
}

// Seção 26.3: agendamento em memória.
const appointment = {
  professionalId: 'prof-1',
  serviceId: created[0].id,
  startAt: '2026-09-10T14:00:00-03:00',
  durationMinutes: 45,
};

console.log('AGENDAMENTO CRIADO');
console.log(scheduleAppointment(appointment));

console.log('OUTRO PROFISSIONAL NO MESMO HORÁRIO');
console.log(scheduleAppointment({ ...appointment, professionalId: 'prof-2' }));

console.log('HORÁRIO CONSECUTIVO PERMITIDO');
console.log(scheduleAppointment({ ...appointment, startAt: '2026-09-10T14:45:00-03:00' }));

const invalidAppointments = [
  { ...appointment, startAt: '2026-09-10T14:30:00-03:00' },
  { ...appointment, durationMinutes: -10 },
];

for (const input of invalidAppointments) {
  try {
    scheduleAppointment(input);
  } catch (error) {
    console.log('Agendamento recusado:', error.message);
  }
}
