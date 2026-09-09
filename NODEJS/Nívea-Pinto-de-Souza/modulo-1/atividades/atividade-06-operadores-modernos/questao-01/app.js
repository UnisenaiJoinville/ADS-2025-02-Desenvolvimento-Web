const person = {
  name: "Ana"
};

const phone = person.contact?.phone;

console.log(phone);

/*O optional chaining (?.) permite acessar uma propriedade sem gerar erro caso alguma parte do caminho não exista. 
Nesse caso, como contact não existe, o resultado é undefined.*/ 