const [, , rawName, rawDuration] = process.argv;
const name = rawName?.trim();
const durationMinutes = Number(rawDuration);
const appEnv = process.env.APP_ENV ?? 'development';

if (!name || !Number.isInteger(durationMinutes) || durationMinutes <= 0) {
  console.error('Informe um nome e uma duração inteira positiva.');
  console.error('Exemplo: npm run cli -- "Consulta" 45');
  process.exitCode = 1;
} else {
  console.log({ name, durationMinutes, appEnv });
}
