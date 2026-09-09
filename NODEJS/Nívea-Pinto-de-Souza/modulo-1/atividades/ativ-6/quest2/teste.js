

let status;

if (service.active) {
  status = "ATIVO";
} else if (service.pending) {
  status = "PENDENTE";
} else {
  status = "INATIVO";
}

/*Para condições com várias possibilidades, o if/else costuma ser mais legível que ternários aninhados, poi
s deixa cada condição mais clara e facilita a manutenção do código.*/ 