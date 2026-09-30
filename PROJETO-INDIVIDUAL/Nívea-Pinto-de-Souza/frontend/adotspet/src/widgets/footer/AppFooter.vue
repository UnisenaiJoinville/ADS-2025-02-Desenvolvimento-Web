<template>
  <footer class="bg-gradient-to-b from-roxo-bg to-roxo pt-12 pb-6 px-6 mt-16">
    <!-- Logo e slogan -->
    <div class="text-center mb-6">
      <div class="w-16 h-16 bg-laranja rounded-full inline-flex items-center justify-center text-white text-3xl mb-3">
        <img :src="logo" alt="logo AdotPets" class="w-8 h-8">
      </div>
      <p class="text-white text-2xl font-bold italic">AdotPets</p>
      <p class="text-white/75 text-sm mt-1 leading-relaxed">
        cada cadastro é uma nova chance<br/>e cada adoção é uma história reescrita.
      </p>
    </div>

    <!-- Redes sociais -->
    <div class="flex justify-center gap-3 mb-8">
      <a v-for="rede in redesSociais" :key="rede.icone"
         :href="rede.url" target="_blank" rel="noopener"
         class="w-9 h-9 bg-laranja rounded-full flex items-center justify-center text-white hover:bg-laranja-hover transition-colors">
        <i :class="`bi bi-${rede.icone}`"></i>
      </a>
    </div>

    <!-- Links -->
    <div class="flex justify-center gap-16 mb-8">
      <div>
        <h4 class="text-white font-semibold text-sm mb-3">Animais</h4>
        <RouterLink v-for="cat in categorias" :key="cat.label"
                    :to="`/adotar?porte=${cat.valor}`"
                    class="block text-white/70 text-sm mb-1.5 hover:text-white transition-colors no-underline">
          {{ cat.label }}
        </RouterLink>
      </div>
      <div>
        <h4 class="text-white font-semibold text-sm mb-3">Cadastre-se</h4>
        <RouterLink to="/cadastro" class="block text-white/70 text-sm mb-1.5 hover:text-white transition-colors no-underline">ONG's</RouterLink>
        <RouterLink to="/adotar"   class="block text-white/70 text-sm mb-1.5 hover:text-white transition-colors no-underline">Adotar</RouterLink>
      </div>
    </div>

    <div class="border-t border-white/15 pt-4 text-center text-white/50 text-xs">
      © 2026 AdotPets . Todos os direitos reservados.
    </div>
  </footer>
</template>

<script setup>
import { RouterLink } from 'vue-router'
import logo from '@/assets/logos/logo-branca.svg'

const redesSociais = [
  { icone: 'facebook', url: '#' },
  { icone: 'instagram', url: '#' },
  { icone: 'tiktok', url: '#' },
]

const categorias = [
  { label: 'Porte Pequeno', valor: 'Pequeno' },
  { label: 'Porte Médio',   valor: 'Médio'   },
  { label: 'Porte Grande',  valor: 'Grande'  },
  { label: 'Felinos',       valor: 'Felino'  },
]
</script>
