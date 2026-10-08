import {
    createService,
    listAllServices,
    listActiveServices,
    findServiceByName,
    deactivateService,
    getAveragePrice,
    searchServicesByName,
    listServicesSortedByPrice,
  } from "./modules/services/service-service.js";
  
  function tryCreate(input) {
    try {
      const service = createService(input);
      console.log(`cadastrado: ${service.name}`);
      return service;
    } catch (error) {
      console.error(`erro ao cadastrar "${input?.name}": ${error.message}`);
      return null;
    }
  }
  
  console.log("=== Cadastrando ao menos 8 serviços ===");
  const consulta = tryCreate({ name: "Consulta", duration: 45, price: 150 });
  tryCreate({ name: "Retorno", duration: 20, price: 60 });
  tryCreate({ name: "Avaliação Física", duration: 60, price: 120 });
  tryCreate({ name: "Exame de Rotina", duration: 30, price: 90 });
  tryCreate({ name: "Consulta de Retorno", duration: 25, price: 70 });
  tryCreate({ name: "Sessão de Fisioterapia", duration: 50, price: 110 });
  tryCreate({ name: "Nutrição Esportiva", duration: 40, price: 130 });
  tryCreate({ name: "Check-up Completo", duration: 90, price: 250 });
  
  console.log("\n=== Provocando 3 erros intencionalmente ===");
  tryCreate({ name: "consulta", duration: 30, price: 100 });      // nome duplicado (case-insensitive)
  tryCreate({ name: "", duration: 50, price: 90 });                // nome vazio
  tryCreate({ name: "Avaliação Extra", duration: -10, price: 120 }); // duração inválida
  
  console.log("\n=== Busca por nome ===");
  const encontrado = findServiceByName("CONSULTA");
  if (encontrado) {
    console.log(`${encontrado.name} encontrado`);
  }
  
  console.log("\n=== Desativando um serviço ===");
  if (consulta) {
    deactivateService(consulta.id);
    console.log(`serviço "${consulta.name}" desativado`);
  }
  
  console.log("\n=== Listagem completa ===");
  console.log(listAllServices());
  
  console.log("\n=== Apenas ativos ===");
  console.log(listActiveServices());
  
  console.log("\n=== Média dos ativos ===");
  console.log(getAveragePrice().toFixed(2));
  
  console.log("\n=== Desafio: busca textual por 'consulta' ===");
  console.log(searchServicesByName("consulta"));
  
  console.log("\n=== Desafio: ordenado por preço (array original intacto) ===");
  console.log(listServicesSortedByPrice());