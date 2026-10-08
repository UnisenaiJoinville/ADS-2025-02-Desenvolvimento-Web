const [, , name, rawDuration] = process.argv;
const durationMinutes = Number(rawDuration);
console.log({ name, durationMinutes });
// Exemplo: node questao-01.js "Consulta" 45
