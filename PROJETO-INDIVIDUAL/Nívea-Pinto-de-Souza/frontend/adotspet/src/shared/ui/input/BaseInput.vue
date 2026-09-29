<template>
  <div class="w-full">
    <label
      v-if="rotulo"
      :class="[
        'block text-sm font-semibold mb-1.5',
        tema === 'escuro' ? 'text-white' : 'text-subtexto',
      ]"
    >
      {{ rotulo }}
    </label>

    <div class="relative">
      <input
        v-bind="$attrs"
        :type="tipoAtual"
        :value="modelValue"
        :placeholder="placeholder"
        :required="obrigatorio"
        :class="[classeInput, classeTema]"
        @input="atualizarValor"
      />

      <button
        v-if="tipo === 'password'"
        type="button"
        class="absolute right-4 top-1/2 -translate-y-1/2 text-subtexto hover:text-roxo transition-colors bg-transparent border-0 cursor-pointer"
        @click="senhaVisivel = !senhaVisivel"
      >
        <i :class="`bi bi-${senhaVisivel ? 'eye-slash' : 'eye'}`"></i>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'

defineOptions({
  inheritAttrs: false,
})

type TipoInput =
  | 'text'
  | 'password'
  | 'email'
  | 'number'
  | 'tel'
  | 'url'
  | 'search'
  | 'date'

type TemaInput = 'claro' | 'escuro'

interface Props {
  modelValue?: string
  rotulo?: string
  placeholder?: string
  tipo?: TipoInput
  obrigatorio?: boolean
  tema?: TemaInput
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: '',
  rotulo: '',
  placeholder: '',
  tipo: 'text',
  obrigatorio: false,
  tema: 'claro',
})

const emit = defineEmits<{
  'update:modelValue': [valor: string]
}>()

const senhaVisivel = ref(false)

const tipoAtual = computed<TipoInput>(() => {
  if (props.tipo === 'password') {
    return senhaVisivel.value ? 'text' : 'password'
  }

  return props.tipo
})

const classeInput =
  'w-full px-5 py-3 rounded-pill text-sm outline-none transition-all'

const classeTema = computed(() => {
  return {
    claro:
      'bg-fundo border-[1.5px] border-gray-200 text-texto focus:border-roxo placeholder:text-subtexto/60',
    escuro:
      'bg-white/15 border-2 border-white/30 text-white placeholder:text-white/60 focus:border-white/70',
  }[props.tema]
})

function atualizarValor(event: Event) {
  const input = event.target as HTMLInputElement

  emit('update:modelValue', input.value)
}
</script>