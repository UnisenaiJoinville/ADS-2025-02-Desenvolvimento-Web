function calculateEndTime(startMinutes, durationMinutes) {
  return startMinutes + durationMinutes;
}

console.log(calculateEndTime(600, 45));

/*A função recebe todos os dados necessários por 
parâmetro e não depende de variáveis externas. Isso
 torna seu comportamento mais previsível e facilita os testes.*/ 