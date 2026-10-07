<template>

  <span :class="[ 'inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold', classesStatus,]">

    <i :class="`bi bi-${iconeStatus}`"></i>

    {{ labelStatus }}

  </span>
</template>

<script setup lang="ts">

import { computed } from 'vue'
import type { AdoptionStatus } from '../model/adoption.status'

const props = defineProps<{
  status: AdoptionStatus
}>()

const labelStatus = computed(() => {
  const labels: Record<AdoptionStatus, string> = {
    SOLICITADA: 'Solicitada',
    EM_ANALISE: 'Em análise',
    ENTREVISTA: 'Entrevista',
    APROVADA: 'Aprovada',
    RECUSADA: 'Recusada',
    CONCLUIDA: 'Concluída',
  }

  return labels[props.status]
})

const iconeStatus = computed(() => {
  const icones: Record<AdoptionStatus, string> = {
    SOLICITADA: 'send',
    EM_ANALISE: 'hourglass-split',
    ENTREVISTA: 'chat-dots',
    APROVADA: 'check-circle',
    RECUSADA: 'x-circle',
    CONCLUIDA: 'heart-fill',
  }

  return icones[props.status]
})

const classesStatus = computed(() => {
  const classes: Record<AdoptionStatus, string> = {
    SOLICITADA: 'bg-blue-100 text-blue-700',
    EM_ANALISE: 'bg-yellow-100 text-yellow-700',
    ENTREVISTA: 'bg-purple-100 text-purple-700',
    APROVADA: 'bg-green-100 text-green-700',
    RECUSADA: 'bg-red-100 text-red-700',
    CONCLUIDA: 'bg-green-200 text-green-800',
  }

  return classes[props.status]
})
</script>