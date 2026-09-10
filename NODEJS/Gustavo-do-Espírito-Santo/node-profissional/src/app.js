import {
  createService,
  deactivateService,
  findServiceByName,
  getActiveServicesSummary,
  listAllServices,
} from './modules/services/service-service.js';
import { scheduleAppointment } from './modules/appointments/appointment-service.js';

function getPort() {
  return Number(process.env.PORT ?? 3000);
}

async function carregarDados() {
  return 'dados carregados';
}

let consulta;

try {
  consulta = createService({ name: 'Consulta', durationMinutes: 45, price: 150 });
  console.log(`cadastrado ${consulta.name}`);
} catch (error) {
  console.error('Falha ao cadastrar serviço:', error.message);
}

try {
  createService({ name: 'consulta', durationMinutes: 30, price: 100 });
} catch (error) {
  console.error('Falha ao cadastrar serviço:', error.message);
}

try {
  createService({ name: '', durationMinutes: 50, price: 90 });
} catch (error) {
  console.error('Falha ao cadastrar serviço:', error.message);
}

try {
  createService({ name: 'Avaliação', durationMinutes: -10, price: 120 });
} catch (error) {
  console.error('Falha ao cadastrar serviço:', error.message);
}

const encontrado = findServiceByName('CONSULTA');

if (encontrado) {
  console.log(`${encontrado.name} encontrado`);
}

if (consulta) {
  deactivateService(consulta.id);
}

console.log(listAllServices());

console.log('Resumo dos ativos:', getActiveServicesSummary());

console.log(`porta: ${getPort()}`);

console.log(await carregarDados());

if (consulta) {
  try {
    const agendamento = scheduleAppointment({
      professionalId: 'prof-1',
      serviceId: consulta.id,
      startAt: '2026-09-10T14:00:00-03:00',
      durationMinutes: 45,
    });
    console.log('agendamento criado:', agendamento);
  } catch (error) {
    console.error('Falha ao agendar:', error.message);
  }

  try {
    scheduleAppointment({
      professionalId: 'prof-1',
      serviceId: consulta.id,
      startAt: '2026-09-10T14:20:00-03:00',
      durationMinutes: 30,
    });
  } catch (error) {
    console.error('Falha ao agendar:', error.message);
  }

  try {
    const semConflito = scheduleAppointment({
      professionalId: 'prof-1',
      serviceId: consulta.id,
      startAt: '2026-09-10T15:00:00-03:00',
      durationMinutes: 30,
    });
    console.log('agendamento criado:', semConflito);
  } catch (error) {
    console.error('Falha ao agendar:', error.message);
  }
}
