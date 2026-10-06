<template>
  <div
    class="bg-white rounded-card shadow-card card-animal cursor-pointer"
    @click="irParaDetalhe"
  >
    <!-- Imagem -->
    <div class="relative">
      <img
        :src="imagemAnimal"
        :alt="animal.nome"
        loading="lazy"
        class="w-full h-44 object-cover rounded-t-card"
        @error="usarImagemPadrao"
      />

      <BadgeAnimal
        variante="laranja"
        class="absolute top-2.5 left-2.5 text-xs shadow-sm"
      >
        {{ etiquetaTipo }}
      </BadgeAnimal>
    </div>

    <!-- Corpo -->
    <div class="p-4">
      <h3 class="text-texto font-bold text-lg mb-2">
        {{ animal.nome }}
      </h3>

      <div class="flex flex-wrap gap-1.5 mb-3">
        <BadgeAnimal
          variante="roxo"
          icone="geo-alt"
        >
          {{ animal.cidade }}
        </BadgeAnimal>

        <BadgeAnimal
          variante="roxo"
          icone="scissors"
        >
          {{ animal.castrado ? 'Castrado' : 'Não cast.' }}
        </BadgeAnimal>

        <BadgeAnimal
          variante="roxo"
          :icone="iconeGenero"
        >
          {{ animal.genero }}
        </BadgeAnimal>

        <BadgeAnimal
          variante="laranja"
          icone="calendar3"
        >
          {{ animal.idade }}
        </BadgeAnimal>
      </div>

      <p class="text-subtexto text-xs leading-relaxed mb-4 line-clamp-3">
        {{ animal.descricao }}
      </p>

      <BotaoBase
        variante="roxo"
        bloco
        icone="heart"
        @click.stop="emitirAdocao"
      >
        ADOTAR
      </BotaoBase>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'

import BadgeAnimal from './BadgeAnimal.vue'
import BotaoBase from '@/shared/ui/button/BaseButton.vue'

import type { Pet } from '../model/pet.types.js'

const props = defineProps<{ animal: Pet }>()

const emit = defineEmits<{ adotar: [animal: Pet]}>()

const roteador = useRouter()

const imagemAnimal = computed(() => {
  return props.animal.imagens?.[0] || '/images/pet-placeholder.png'
})

const etiquetaTipo = computed(() => {
  return props.animal.especie === 'Gato'
    ? 'Felinos'
    : `Porte ${props.animal.porte}`
})

const iconeGenero = computed(() => {
  return props.animal.genero === 'Fêmea'
    ? 'gender-female'
    : 'gender-male'
})

function irParaDetalhe() {
  roteador.push({
    name: 'animal-detalhe',
    params: {
      id: props.animal.id,
    },
  })
}

function emitirAdocao() {
  emit('adotar', props.animal)
}

function usarImagemPadrao(evento: Event) {
  const imagem = evento.target as HTMLImageElement

  imagem.src = '/images/pet-placeholder.png'
}
</script>