<template>
<span :class="[ 'inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium',
      classesVariante]">
    <i v-if="icone":class="`bi bi-${icone}`"></i>

    <slot />

  </span>
</template>

<script setup lang="ts">
    import { computed } from 'vue'

    const props = defineProps<{ variante?: 'roxo' | 'laranja'
        icone?: string
    }>()

    const classesVariante = computed(() => {
        if (props.variante === 'laranja') {
        return 'bg-orange-100 text-orange-700'
    }

    return 'bg-purple-100 text-purple-700'
})
</script>