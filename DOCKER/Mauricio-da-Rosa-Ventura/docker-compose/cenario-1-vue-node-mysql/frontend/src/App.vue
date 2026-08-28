<script setup>
import { ref, onMounted } from "vue";

// Componente unico e minimo: so prova, do lado do navegador, que o frontend
// consegue falar com a API (porta publicada 3000), que por sua vez fala com
// mysql/redis/rabbitmq (ver backend/src/index.js). Nenhuma regra de negocio
// e implementada aqui de proposito - o foco desta atividade e a estrutura de
// containers, nao a aplicacao.
const status = ref(null);
const erro = ref(null);

async function verificar() {
  erro.value = null;
  try {
    const resp = await fetch("http://localhost:3000/api/status");
    status.value = await resp.json();
  } catch (e) {
    erro.value = e.message;
  }
}

onMounted(verificar);
</script>

<template>
  <main style="font-family: sans-serif; max-width: 640px; margin: 2rem auto">
    <h1>Cenário 1 — Docker Compose</h1>
    <p>VueJS + NodeJS + MySQL + Redis + RabbitMQ (ver DOCKER/Mauricio-da-Rosa-Ventura/docker-compose/cenario-1-vue-node-mysql).</p>
    <button @click="verificar">Testar conexão com a API</button>
    <p v-if="erro" style="color: crimson">Erro: {{ erro }}</p>
    <pre v-if="status">{{ JSON.stringify(status, null, 2) }}</pre>
  </main>
</template>
