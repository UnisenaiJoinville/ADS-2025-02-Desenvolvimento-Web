<template>
  <header class="bg-roxo shadow-sm sticky top-0 z-50">
    <div class="w-full flex items-center justify-between py-1">
      <RouterLink
        to="/"
        class="flex items-center gap-2 shrink-0 pl-4 md:pl-8 lg:pl-10 no-underline">
        <div class="w-10 h-10 bg-laranja rounded-full flex items-center justify-center text-white">
          <img :src="Logo" alt="Logo" />
        </div>

        <span class="font-bold text-white text-2xl">
          AdotPets
        </span>
      </RouterLink>

      <button
        @click="menuMobileAberto = !menuMobileAberto"
        class="lg:hidden text-white pr-4"
        aria-label="Abrir menu">
        <i class="bi bi-list text-4xl leading-none"></i>
      </button>

      <div class="hidden lg:flex items-center justify-between bg-white rounded-bl-[40px]
          h-14
          px-4 xl:px-6
          w-[760px] xl:w-[860px]
          ml-6
          flex-shrink-0">
        <ul class="flex items-center gap-1 xl:gap-2 list-none m-0 p-0">

          <li>
            <RouterLink
              to="/"
              class="nav-pill"
              active-class="nav-pill--ativo">
              <i class="bi bi-house-heart"></i>
              Início
            </RouterLink>
          </li>

          <li>
            <RouterLink
              to="/adotar"
              class="nav-pill"
              active-class="nav-pill--ativo">
              <i class="bi bi-heart"></i>
              Animais
            </RouterLink>
          </li>

          <li>
            <RouterLink
              to="/ongs"
              class="nav-pill"
              active-class="nav-pill--ativo">
              <i class="bi bi-balloon-heart"></i>
              ONGs
            </RouterLink>
          </li>

        </ul>
        <div class="relative shrink-0">

          <RouterLink
            v-if="auth.estaLogado"
            to="/minha-conta"
            class="
              w-10 h-10
              rounded-full
              bg-laranja
              flex items-center justify-center
              text-white
              text-sm font-bold
              no-underline
              hover:scale-105
              transition-all duration-200
            "
          >
            {{ auth.iniciais }}
          </RouterLink>

          <RouterLink
            v-else
            to="/entrar"
            class="
              w-10 h-10
              rounded-full
              bg-laranja
              flex items-center justify-center
              text-white
              no-underline
              hover:scale-105
              transition-all duration-200
            "
          >
            <i class="bi bi-person-fill text-lg"></i>
          </RouterLink>

        </div>

      </div>
    </div>

    <!-- Menu mobile -->
    <div
      v-show="menuMobileAberto"
      class="lg:hidden bg-white px-4 py-4 w-full max-w-sm sm:max-w-md mx-auto rounded-2xl ">

      <ul class="flex flex-col gap-2 list-none m-0 p-0 mb-4">

        <li>
          <RouterLink
            to="/"
            class="nav-pill"
            active-class="nav-pill--ativo"
            @click="fecharMenu"
          >
            <i class="bi bi-house-heart"></i>
            Início
          </RouterLink>
        </li>

        <li>
          <RouterLink
            to="/adotar"
            class="nav-pill"
            active-class="nav-pill--ativo"
            @click="fecharMenu"
          >
            <i class="bi bi-heart"></i>
            Animais
          </RouterLink>
        </li>

        <li>
          <RouterLink
            to="/ongs"
            class="nav-pill"
            active-class="nav-pill--ativo"
            @click="fecharMenu"
          >
            <i class="bi bi-balloon-heart"></i>
            ONGs
          </RouterLink>
        </li>
      </ul>

      <!-- Área usuário mobile -->
      <div class="border-t border-gray-100 pt-3">

        <template v-if="auth.estaLogado">

          <div class="flex items-center gap-3 px-2 mb-3">

            <div
              class="
                w-9 h-9
                rounded-xl
                bg-roxo
                flex items-center justify-center
                text-white
                font-bold
                text-sm
                shrink-0
              "
            >
              {{ auth.iniciais }}
            </div>

            <div>
              <p class="font-semibold text-texto text-sm leading-none">
                {{ auth.usuarioAtual.nome }}
              </p>

              <p class="text-[11px] text-subtexto">
                {{ rotuloPerfil }}
              </p>
            </div>

          </div>

          <RouterLink
            to="/minha-conta"
            class="nav-pill"
            @click="fecharMenu"
          >
            <i class="bi bi-person-fill"></i>
            Minha Conta
          </RouterLink>

          <RouterLink
            v-if="auth.ehOng || auth.ehAdmin"
            to="/admin"
            class="nav-pill"
            @click="fecharMenu"
          >
            <i class="bi bi-grid-1x2-fill"></i>

            {{ auth.ehAdmin ? 'Painel Admin' : 'Dashboard ONG' }}
          </RouterLink>

          <button
            @click="sairMobile"
            class="nav-pill text-rose-500 hover:bg-rose-50 w-full text-left mt-1"
          >
            <i class="bi bi-box-arrow-right"></i>
            Sair
          </button>

        </template>

        <template v-else>

          <RouterLink
            to="/entrar"
            class="
              block
              text-center
              text-sm
              font-semibold
              text-white
              bg-roxo
              py-2.5
              rounded-full
              no-underline
            "
            @click="fecharMenu"
          >
            Entrar
          </RouterLink>

        </template>

      </div>

    </div>

  </header>
</template>

<script setup>


import { ref, computed } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/useAuthStore'
import Logo from '@/assets/logos/logo-branca.svg'


const auth = useAuthStore()
const router = useRouter()

const menuMobileAberto = ref(false)

const rotuloPerfil = computed(() => {
  const tipo = auth.usuarioAtual?.tipo_usuario

  if (tipo === 'admin') return 'Administrador do Sistema'
  if (tipo === 'parceiro') return 'ONG Parceira'

  return 'Adotante'
})

function fecharMenu() {
  menuMobileAberto.value = false
}

function sairMobile() {
  auth.fazerLogout()
  fecharMenu()
  router.push('/')
}
</script>

<style scoped>
.nav-pill {
  @apply flex items-center gap-2
  text-texto text-sm font-medium
  px-3 xl:px-4
  py-2
  rounded-full
  transition-all duration-200
  no-underline
  whitespace-nowrap;
}

.nav-pill:hover,
.nav-pill--ativo {
  @apply text-roxo font-semibold bg-roxo-claro;
}
</style>