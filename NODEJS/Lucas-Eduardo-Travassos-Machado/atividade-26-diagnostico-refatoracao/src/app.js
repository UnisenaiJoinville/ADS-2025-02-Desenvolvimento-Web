import {
  createService,
  deactivateService,
  getAverageActivePrice,
  listServices,
  searchService,
} from "./modules/services/service-service.js";

function lerConfig() {
  try {
    const porta = process.env.PORT || 3000;
    console.log("porta: " + porta);
  } catch (e) {
  }
}

async function carregar() {
  return Promise.resolve("dados carregados");
}

try {
  createService("Consulta", 45, 150);

  try {
    createService("consulta", 30, 100);
  } catch (error) {
    console.error("Erro esperado (nome duplicado):", error.message);
  }

  try {
    createService("", 50, 90);
  } catch (error) {
    console.error("Erro esperado (nome vazio):", error.message);
  }

  createService("Avaliação", 10, 120);

  const servico = searchService("CONSULTA");

  if (servico) {
    console.log(servico.name + " encontrado");
  }

  deactivateService(1);

  console.log(listServices());

  console.log("Média:", getAverageActivePrice());

  lerConfig();

  carregar().then((resultado) => {
    console.log(resultado);
  });
} catch (erro) {
  console.log("deu erro:", erro.message);
}