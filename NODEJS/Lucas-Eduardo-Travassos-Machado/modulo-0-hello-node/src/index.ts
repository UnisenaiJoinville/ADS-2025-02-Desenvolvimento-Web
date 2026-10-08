import dayjs from "dayjs";

const timestamp = dayjs().format("DD/MM/YYYY HH:mm:ss");

console.log(`Ambiente OK, ${process.version}`);
console.log(`Validado em: ${timestamp}`);
