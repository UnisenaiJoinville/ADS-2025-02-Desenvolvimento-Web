<script setup>
import { ref, onMounted } from "vue";

// Frontend minimo do Cenario 3: testa a API (health/status) e permite
// disparar um evento (POST /eventos), que a API grava no Postgres e publica
// no RabbitMQ para o worker processar de forma assincrona.
const API = "http://localhost:3001";

const status = ref(null);
const erro = ref(null);
const ultimoEvento = ref(null);

async function verificarStatus() {
  erro.value = null;
  try {
    const resp = await fetch(`${API}/status`);
    status.value = await resp.json();
  } catch (e) {
    erro.value = e.message;
  }
}

async function dispararEvento() {
  erro.value = null;
  try {
    const resp = await fetch(`${API}/eventos`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tipo: "evento-de-teste" }),
    });
    ultimoEvento.value = await resp.json();
    await verificarStatus();
  } catch (e) {
    erro.value = e.message;
  }
}

onMounted(verificarStatus);
</script>

<template>
  <main style="font-family: sans-serif; max-width: 640px; margin: 2rem auto">
    <h1>Cenário 3 — Consolidação</h1>
    <p>Vue + Fastify + PostgreSQL + Redis + RabbitMQ + worker dedicado.</p>
    <button @click="verificarStatus">Testar conexão com a API</button>
    <button @click="dispararEvento">Disparar evento (POST /eventos)</button>
    <p v-if="erro" style="color: crimson">Erro: {{ erro }}</p>
    <p v-if="ultimoEvento">Último evento enviado: {{ JSON.stringify(ultimoEvento) }}</p>
    <pre v-if="status">{{ JSON.stringify(status, null, 2) }}</pre>
  </main>
</template>
