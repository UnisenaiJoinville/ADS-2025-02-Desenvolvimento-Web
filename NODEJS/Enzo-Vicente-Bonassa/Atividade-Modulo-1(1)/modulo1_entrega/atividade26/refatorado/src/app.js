import {
  createService,
  searchService,
  listServices,
  deactivateService,
  calculateAveragePrice,
} from './modules/services/service-service.js';

function showCreation(input) {
  try {
    const service = createService(input);
    console.log(`Cadastrado: ${service.name}`);
  } catch (error) {
    console.log(`Não foi possível cadastrar: ${error.message}`);
  }
}

function readPort() {
  const port = Number(process.env.PORT ?? 3000);

  if (!Number.isInteger(port) || port <= 0) {
    throw new Error('PORT deve ser um inteiro positivo.');
  }

  return port;
}

async function loadData() {
  return 'Dados carregados.';
}

try {
  showCreation({ name: 'Consulta', durationMinutes: '45', price: 150 });
  showCreation({ name: 'consulta', durationMinutes: 30, price: 100 });
  showCreation({ name: '', durationMinutes: 50, price: 90 });
  showCreation({ name: 'Avaliação', durationMinutes: -10, price: 120 });

  const service = searchService('CONSULTA');

  if (service) {
    console.log(`${service.name} encontrado.`);
  }

  deactivateService('1');

  console.log('Serviços:', listServices());
  console.log(`Média: ${calculateAveragePrice().toFixed(2)}`);
  console.log(`Porta: ${readPort()}`);
  console.log(await loadData());
} catch (error) {
  console.log(`Erro: ${error.message}`);
}
