import dayjs from "dayjs";

function mostrarAmbiente(): void {
  const agora = dayjs().format("DD/MM/YYYY HH:mm:ss");

  console.log("Ambiente Node.js funcionando!");
  console.log(`Versão do Node.js: ${process.version}`);
  console.log(`Data e hora: ${agora}`);
  console.log("Dependência externa utilizada: dayjs");
}

mostrarAmbiente();
