const profile = "ADMIN";

switch (profile) {
  case "ADMIN":
    console.log("Administrador");
    break;

  case "PROFESSIONAL":
    console.log("Profissional");
    break;

  case "CUSTOMER":
    console.log("Cliente");
    break;

  default:
    console.log("Perfil inválido");
}

/*O switch permite executar comportamentos 
diferentes de acordo com o valor recebido, sendo 
útil quando existem várias opções bem definidas,
 como os perfis de usuário.*/ 