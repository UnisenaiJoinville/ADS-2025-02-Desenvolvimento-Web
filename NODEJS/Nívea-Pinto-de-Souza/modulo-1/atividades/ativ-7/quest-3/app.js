function canSchedule(service, durationMinutes, professionalAvailable) {
  if (!service.active) {
    return false;
  }

  if (durationMinutes <= 0) {
    return false;
  }

  if (!professionalAvailable) {
    return false;
  }

  return true;
}

/*A refatoração utiliza early return para tratar as condições
 inválidas primeiro. Assim, reduzimos os if aninhados e deixamos 
 o fluxo da função mais simples e legível.*/ 