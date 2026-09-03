document.getElementById('btn').addEventListener('click', async () => {
  const resposta = await fetch('/api/produtos');
  const dados = await resposta.json();
  document.getElementById('saida').textContent = JSON.stringify(dados, null, 2);
});
