<template>
  <div class="select-none">
    <div class="relative overflow-hidden rounded-3xl bg-gray-100" style="height: 340px">
      <Transition :name="`carrossel-${direcao}`" mode="out-in">
        <img :key="indiceAtivo" :src="fotos[indiceAtivo]" :alt="`Foto ${indiceAtivo + 1}`" class="w-full h-full object-cover"/>
      </Transition>

      <button @click="anterior"
        class="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/40 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-black/65 transition-colors z-10"><i class="bi bi-chevron-left text-sm font-bold"></i></button>

      <button @click="proxima"
        class="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/40 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-black/65 transition-colors z-10"><i class="bi bi-chevron-right text-sm font-bold"></i></button>

      <div class="absolute bottom-3 right-3 bg-black/50 backdrop-blur-sm text-white text-xs px-2.5 py-1 rounded-full font-medium z-10">{{ indiceAtivo + 1 }} / {{ fotos.length }}</div>

      <div class="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
        <button v-for="(_, i) in fotos" :key="i" @click="irPara(i)" :class="['rounded-full transition-all duration-300 shadow', i === indiceAtivo ? 'w-5 h-2 bg-white' : 'w-2 h-2 bg-white/50 hover:bg-white/80']"/>
      </div>
    </div>

    <div class="flex gap-2 mt-3 overflow-x-auto scrollbar-none pb-1">
      <button
        v-for="(foto, i) in fotos"
        :key="i"
        @click="irPara(i)"
        :class="['w-16 h-16 rounded-xl overflow-hidden shrink-0 border-2 transition-all duration-200',
                 i === indiceAtivo
                   ? 'border-laranja scale-105 shadow-md'
                   : 'border-transparent opacity-55 hover:opacity-100 hover:scale-105']">
        <img :src="foto" :alt="'Miniatura ${i + 1}'" class="w-full h-full object-cover" />
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const props = defineProps({
  fotos: { type: Array, required: true },
})

const indiceAtivo = ref(0)
const direcao     = ref('next')

function anterior() {
  direcao.value     = 'prev'
  indiceAtivo.value = (indiceAtivo.value - 1 + props.fotos.length) % props.fotos.length
}

function proxima() {
  direcao.value     = 'next'
  indiceAtivo.value = (indiceAtivo.value + 1) % props.fotos.length
}

function irPara(i) {
  direcao.value     = i > indiceAtivo.value ? 'next' : 'prev'
  indiceAtivo.value = i
}
</script>

<style scoped>
    .carrossel-next-enter-active,
    .carrossel-next-leave-active,
    .carrossel-prev-enter-active,
    .carrossel-prev-leave-active { transition: opacity 0.3s ease, transform 0.3s ease; }

    .carrossel-next-enter-from { opacity: 0; transform: translateX(40px); }
    .carrossel-next-leave-to   { opacity: 0; transform: translateX(-40px); }
    .carrossel-prev-enter-from { opacity: 0; transform: translateX(-40px); }
    .carrossel-prev-leave-to   { opacity: 0; transform: translateX(40px); }
</style>
