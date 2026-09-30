<template>
  <div class="flex h-full flex-col">
    <RouterLink to="/admin" class="group flex items-center gap-3 px-5 py-5 no-underline">
      <div :class="classeLogo"><img
          :src="logo"
          alt="Logo AdotPets"
          class="h-5 w-5"
        />
      </div>

      <span class="text-lg font-bold tracking-wide text-white">
        AdotPets
      </span>
    </RouterLink>

    <nav class="flex flex-1 flex-col gap-0.5 px-3">
      <SidebarItem
        to="/admin"
        icone="graph-up"
        label="Dashboard"
        exact
        @click="fechar"
      />

      <SidebarItem
        to="/admin/animais"
        icone="postcard-heart"
        :label="auth.ehOng ? 'Meus Animais' : 'Animais'"
        @click="fechar"
      />

      <SidebarItem
        to="/admin/adocoes"
        icone="clipboard-check"
        :label="auth.ehOng ? 'Solicitações' : 'Adoções'"
        @click="fechar"
      />

      <template v-if="auth.ehAdmin">
        <SidebarItem
          to="/admin/ongs"
          icone="house-heart"
          label="ONG's"
          @click="fechar"
        />

        <SidebarItem
          to="/admin/usuarios"
          icone="person-plus"
          label="Usuários"
          @click="fechar"
        />
      </template>

      <div
        v-if="auth.ehOng && nomeOng"
        class="mx-1 mt-3 rounded-xl border border-white/10 bg-white/5 px-3 py-2"
      >
        <p class="mb-0.5 text-[10px] uppercase tracking-wider text-white/40">
          Gerenciando
        </p>

        <p class="truncate text-xs font-semibold text-white">
          {{ nomeOng }}
        </p>
      </div>
    </nav>

    <div class="flex flex-col gap-0.5 border-t border-white/10 px-3 pb-5 pt-3">
      <SidebarItem
        to="/admin/configuracao"
        icone="gear-fill"
        label="Configurações"
        @click="fechar"
      />

      <button
        :class="classeBotaoSair"
        @click="sair"
      >
        <i class="bi bi-box-arrow-right"></i>

        <span>
          Sair
        </span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink, useRouter } from 'vue-router'

import SidebarItem from './SidebarItem.vue'

import { useAuthStore } from '@/entities/user/model/auth.store'

import dadosOngs from '@/shared/mocks/ongs.json'
import logo from '@/shared/assets/images/logo-branca.svg'

const emit = defineEmits<{
  fechar: []
}>()

const auth = useAuthStore()
const router = useRouter()

const classeLogo =
  'flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-laranja shadow-md transition-transform group-hover:scale-105'

const classeBotaoSair =
  'flex w-full items-center gap-3 rounded-xl px-4 py-2.5 text-left text-sm font-medium text-white/60 transition-all hover:bg-white/10 hover:text-white'

const nomeOng = computed(() => {
  return dadosOngs.find(
    ong => ong.id === auth.ongIdAtual,
  )?.nome ?? ''
})

function fechar() {
  emit('fechar')
}

function sair() {
  auth.fazerLogout()

  router.push('/')
}
</script>