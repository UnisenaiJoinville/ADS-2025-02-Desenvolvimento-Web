<template>
  <button
    :type="tipo"
    :disabled="carregando || desabilitado"
    :class="[classeBase, classesVariante, classeBloco]">
    <i v-if="icone && !carregando" :class="`bi bi-${icone}`" ></i>
    <i v-if="carregando" class="bi bi-arrow-repeat animate-spin"></i>
    <slot />
  </button>
</template>

<script setup lang="ts">
import { computed } from 'vue'

type VarianteBotao = 'laranja' | 'roxo' | 'outline' | 'perigo'

interface Props {
  variante?: VarianteBotao
  tipo?: 'button' | 'submit' | 'reset'
  icone?: string
  carregando?: boolean
  desabilitado?: boolean
  bloco?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  variante: 'laranja',
  tipo: 'button',
  icone: '',
  carregando: false,
  desabilitado: false,
  bloco: false,
})

const classeBase = 'inline-flex items-center justify-center gap-2 rounded-pill font-semibold text-sm px-6 py-2.5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer border-0 uppercase tracking-wide'

const classesVariante = computed(() => {
  return {
    laranja: 'bg-laranja hover:bg-laranja-hover text-white',
    roxo: 'bg-roxo hover:bg-roxo-hover text-white',
    outline:'bg-transparent border-2 border-roxo text-roxo hover:bg-roxo hover:text-white',
    perigo: 'bg-red-500 hover:bg-red-600 text-white',
  }[props.variante]
})

const classeBloco = computed(() => {
  return props.bloco ? 'w-full' : ''
})
</script>