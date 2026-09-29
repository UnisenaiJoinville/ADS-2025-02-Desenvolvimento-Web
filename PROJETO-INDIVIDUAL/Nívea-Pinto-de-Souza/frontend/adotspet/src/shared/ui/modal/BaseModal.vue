<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition-opacity duration-200 ease-out"
      leave-active-class="transition-opacity duration-200 ease-in"
      enter-from-class="opacity-0"
      leave-to-class="opacity-0"
    >
      <div
        v-if="aberto"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4"
        @click.self="fechar"
      >
        <div
          class="w-full max-w-md rounded-[20px] bg-white p-8 shadow-forte"
        >
          <slot />
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
interface Props {
  aberto: boolean
}

defineProps<Props>()

const emit = defineEmits<{
  fechar: []
}>()

function fechar() {
  emit('fechar')
}
</script>