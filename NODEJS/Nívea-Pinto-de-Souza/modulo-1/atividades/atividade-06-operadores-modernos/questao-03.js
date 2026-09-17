const service = { active: false, pending: true };
let status;

if (service.active) {
  status = "ATIVO";
} else if (service.pending) {
  status = "PENDENTE";
} else {
  status = "INATIVO";
}

console.log(status);
