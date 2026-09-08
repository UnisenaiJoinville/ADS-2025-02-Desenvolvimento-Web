const saida = document.getElementById('saida');

function mostrar(dados) {
  saida.textContent = JSON.stringify(dados, null, 2);
}

document.getElementById('listar').addEventListener('click', async () => {
  const r = await fetch('/api/livros');
  mostrar(await r.json());
});

document.getElementById('saude').addEventListener('click', async () => {
  const r = await fetch('/api/health');
  mostrar(await r.json());
});

document.getElementById('emprestar').addEventListener('click', async () => {
  const r = await fetch('/api/emprestimos', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ livroId: 1, aluno: 'Bruno Silva' }),
  });
  mostrar(await r.json());
});
