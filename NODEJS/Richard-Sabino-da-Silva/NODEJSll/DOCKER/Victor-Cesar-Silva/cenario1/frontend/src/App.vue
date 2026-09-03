<script setup>
import { ref, onMounted } from 'vue';

const agendamentos = ref([]);
const origem = ref('');
const paciente = ref('');

// O navegador roda no host, entao chama /api, que o Vite repassa para o container api.
async function carregar() {
  const r = await fetch('/api/agendamentos');
  const json = await r.json();
  agendamentos.value = json.dados;
  origem.value = json.origem;
}

async function criar() {
  if (!paciente.value) return;
  await fetch('/api/agendamentos', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ paciente: paciente.value }),
  });
  paciente.value = '';
  await carregar();
}

onMounted(carregar);
</script>

<template>
  <main style="font-family: sans-serif; padding: 2rem">
    <h1>Agendamentos — Cenário 1</h1>
    <p>Fonte dos dados: <strong>{{ origem }}</strong></p>

    <input v-model="paciente" placeholder="Nome do paciente" />
    <button @click="criar">Criar</button>

    <ul>
      <li v-for="a in agendamentos" :key="a.id">{{ a.id }} — {{ a.paciente }}</li>
    </ul>
  </main>
</template>
