var x = [];

var contador = 1;

function fazer(a, b, c) {
  if (a == undefined || a == "") {
    console.log("erro");
    return;
  } else {
    if (b == undefined || b == "") {
      console.log("erro");
      return;
    } else {
      if (c < 0) {
        console.log("erro");
        return;
      }
    }
  }

  var obj = {
    id: contador,
    nome: a,
    duracao: b,
    preco: c,
    ativo: "sim"
  };

  contador = contador + 1;

  x.push(obj);

  console.log("cadastrado " + a);

  return obj;
}

function buscar(n) {
  var achou = null;

  for (var i = 0; i < x.length; i++) {
    if (x[i].nome.toLowerCase() == n.toLowerCase()) {
      achou = x[i];
    }
  }

  return achou;
}

function listar() {
  return x;
}

function desativar(id) {
  for (var i = 0; i < x.length; i++) {
    if (x[i].id == id) {
      x[i].ativo = "nao";
    }
  }
}

function media() {
  var soma = 0;
  var quantidade = 0;

  for (var i = 0; i < x.length; i++) {
    if (x[i].ativo == "sim") {
      soma = soma + x[i].preco;
      quantidade++;
    }
  }

  return soma / quantidade;
}

function lerConfig() {
  try {
    var porta = process.env.PORT || 3000;
    console.log("porta: " + porta);
  } catch (e) {
  }
}

async function carregar() {
  return Promise.resolve("dados carregados");
}

try {
  fazer("Consulta", "45", 150);
  fazer("consulta", 30, 100);
  fazer("", 50, 90);
  fazer("Avaliação", -10, 120);

  var servico = buscar("CONSULTA");

  if (servico != null) {
    console.log(servico.nome + " encontrado");
  }

  desativar("1");

  console.log(listar());

  console.log("Média: " + media());

  lerConfig();

  carregar().then(function (resultado) {
    console.log(resultado);
  });

} catch (erro) {
  console.log("deu erro");
}