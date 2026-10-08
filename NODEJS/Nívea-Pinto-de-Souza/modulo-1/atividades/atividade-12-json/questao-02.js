const invalidJson = '{ "name": "Consulta", }';

try {
  JSON.parse(invalidJson);
} catch (error) {
  console.log("JSON inválido:", error.name);
}
