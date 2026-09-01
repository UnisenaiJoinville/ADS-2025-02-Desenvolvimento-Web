<script setup>
import { ref, onMounted } from 'vue';

const tarefas = ref([]);
const origem = ref('');
const saude = ref('');
const titulo = ref('');

// O Nginx do proprio container repassa /api para o backend na rede interna.
async function carregar() {
  const r = await fetch('/api/tarefas');
  const json = await r.json();
  tarefas.value = json.dados;
  origem.value = json.origem;
}

async function verSaude() {
  const r = await fetch('/api/health');
  saude.value = JSON.stringify(await r.json());
}

async function criar() {
  if (!titulo.value) return;
  await fetch('/api/tarefas', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ titulo: titulo.value }),
  });
  titulo.value = '';
  await carregar();
}

onMounted(() => {
  carregar();
  verSaude();
});
</script>

<template>
  <main style="font-family: sans-serif; padding: 2rem; max-width: 640px">
    <h1>Tarefas — Cenário 3</h1>
    <p>Fonte dos dados: <strong>{{ origem }}</strong></p>
    <p>Health: <code>{{ saude }}</code></p>

    <input v-model="titulo" placeholder="Título da tarefa" @keyup.enter="criar" />
    <button @click="criar">Criar</button>

    <ul>
      <li v-for="t in tarefas" :key="t.id">{{ t.id }} — {{ t.titulo }}</li>
    </ul>
  </main>
</template>
