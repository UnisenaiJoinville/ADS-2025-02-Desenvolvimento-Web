function canSchedule(service, durationMinutes) {
  if (!service.active) {
    return false;
  }

  if (durationMinutes <= 0) {
    return false;
  }

  return true;
}

/*O early return permite encerrar a função assim que uma condição inválida é encontrada,
 evitando if aninhados e deixando o código mais simples de entender*/ 