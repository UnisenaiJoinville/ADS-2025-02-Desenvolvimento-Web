<template>
  <div class="flex items-center px-7 py-5">
    <template
      v-for="(passo, index) in passos"
      :key="passo.numero"
    >
      <div
        class="flex shrink-0 items-center gap-2"
      >
        <div
          :class="[
            classeCirculo,
            classeEtapa(passo.numero),
          ]"
        >
          <i
            v-if="etapa > passo.numero"
            class="bi bi-check-lg text-xs"
          ></i>

          <span v-else>
            {{ passo.numero }}
          </span>
        </div>

        <span
          :class="[
            'hidden text-xs font-semibold sm:block',
            classeTexto(passo.numero),
          ]"
        >
          {{ passo.label }}
        </span>
      </div>

      <div
        v-if="index < passos.length - 1"
        :class="[
          'mx-3 flex-1 border-t-2 border-dashed',
          etapa > passo.numero
            ? 'border-green-400'
            : 'border-gray-200',
        ]"
      ></div>
    </template>
  </div>
</template>

<script setup lang="ts">
import type {
  AdoptionStep,
} from '../model/adoption.types'

interface Props {
  etapa: number
  passos: AdoptionStep[]
}

const props = defineProps<Props>()

const classeCirculo =
  'flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold transition-colors'

function classeEtapa(numero: number) {
  if (props.etapa > numero) {
    return 'bg-green-500 text-white'
  }

  if (props.etapa === numero) {
    return 'bg-roxo text-white'
  }

  return 'border-2 border-gray-300 text-subtexto'
}

function classeTexto(numero: number) {
  if (props.etapa > numero) {
    return 'text-green-500'
  }

  if (props.etapa === numero) {
    return 'text-roxo'
  }

  return 'text-subtexto'
}
</script>