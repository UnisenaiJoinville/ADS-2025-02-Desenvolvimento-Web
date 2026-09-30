<template>
  <RouterLink
    :to="to"
    :class="classeBase"
    :active-class="exact ? undefined : classeAtiva"
    :exact-active-class="exact ? classeAtiva : undefined"
  >
    <i :class="`bi bi-${icone} text-base`"></i>

    <span>
      {{ label }}
    </span>
  </RouterLink>
</template>

<script setup lang="ts">
import {
  RouterLink,
  type RouteLocationRaw,
} from 'vue-router'

interface Props {
  to: RouteLocationRaw
  icone: string
  label: string
  exact?: boolean
}

withDefaults(defineProps<Props>(), {
  exact: false,
})

const classeBase =
  'flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium text-white/60 no-underline transition-all hover:bg-white/10 hover:text-white'

const classeAtiva =
  'bg-laranja! text-white! hover:bg-laranja/90!'
</script>