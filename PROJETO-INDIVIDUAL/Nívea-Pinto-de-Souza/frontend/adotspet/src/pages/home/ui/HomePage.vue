<template>
  <main class="min-h-screen bg-fundo">

    <!-- =========================================================
         HERO
    ========================================================== -->
    <section class="bg-gradient-to-br from-roxo-bg via-roxo to-roxo-hover">

      <div
        class="max-w-6xl mx-auto px-6 flex items-center gap-12 w-full"
      >
        <!-- Imagem do banner -->
        <img
          :src="Logo"
          alt="AdotPets"
          class="w-[40%] max-w-[420px] object-cover shrink-0 hidden md:block"
        />

        <!-- Conteúdo -->
        <div class="py-12 md:py-16">

          <span
            class="inline-flex items-center gap-2
                   border border-white/30
                   rounded-pill
                   px-4 py-1
                   text-white/90
                   text-xs
                   font-semibold
                   mb-4"
          >
            <i class="bi bi-heart-fill text-laranja"></i>

            Adoção responsável
          </span>

          <h1
            class="text-white
                   text-3xl md:text-4xl
                   font-bold
                   uppercase
                   leading-tight
                   mb-3"
          >
            Mais adoções,
            mais lares e
            <br />
            mais amor
          </h1>

          <p
            class="text-white/80
                   text-sm
                   leading-relaxed
                   mb-6
                   max-w-md"
          >
            Conheça nossos animais disponíveis para adoção
            e encontre um novo companheiro para fazer parte
            da sua família.
          </p>

          <BotaoBase
            variante="laranja"
            icone="bag-heart-fill"
            class="text-base px-8 py-3"
            @click="irParaAnimais"
          >
            Quero Adotar
          </BotaoBase>

        </div>
      </div>


      <!-- =====================================================
           PAINEL SOBREPOSTO
      ====================================================== -->
      <div
        class="max-w-6xl
               mx-auto
               px-6
               pb-10
               -mb-7
               relative
               z-10"
      >

        <div
          class="bg-white
                 rounded-2xl
                 shadow-forte
                 p-4
                 flex
                 flex-col md:flex-row
                 gap-4
                 md:items-center
                 md:justify-between"
        >

          <div class="flex items-center gap-4">

            <div
              class="w-12 h-12
                     rounded-full
                     bg-roxo-claro
                     text-roxo
                     flex
                     items-center
                     justify-center
                     shrink-0"
            >
              <i class="bi bi-person-heart text-xl"></i>
            </div>

            <div>
              <h2 class="font-bold text-texto text-sm md:text-base">
                Já iniciou um processo de adoção?
              </h2>

              <p class="text-subtexto text-xs mt-0.5">
                Entre na sua conta para acompanhar o andamento
                das suas solicitações.
              </p>
            </div>

          </div>


          <div class="flex flex-col sm:flex-row gap-2">

            <BotaoBase
              variante="roxo"
              icone="clipboard-heart"
              class="whitespace-nowrap"
              @click="irParaMinhasAdocoes"
            >
              Minhas adoções
            </BotaoBase>

            <BotaoBase
              variante="laranja"
              icone="person-plus"
              class="whitespace-nowrap"
              @click="irParaCadastro"
            >
              Criar conta
            </BotaoBase>

          </div>

        </div>
      </div>

    </section>


    <!-- =========================================================
         ADOÇÃO + ANIMAIS
    ========================================================== -->
    <section class="max-w-6xl mx-auto px-6 pt-14 pb-12">

      <div
        class="flex
               flex-col
               lg:flex-row
               gap-8
               items-start"
      >

        <!-- =====================================================
             COLUNA ESQUERDA
             Mantém o mesmo espaço onde ficavam as ONGs
        ====================================================== -->
        <aside class="w-full lg:w-[26%] shrink-0">

          <div
            class="bg-white
                   rounded-3xl
                   shadow-sm
                   border
                   border-gray-100
                   p-5
                   lg:sticky
                   lg:top-24"
          >

            <!-- Cabeçalho -->
            <div class="mb-5">

              <span
                class="inline-block
                       border-2
                       border-laranja
                       text-laranja
                       rounded-full
                       px-3
                       py-0.5
                       text-[10px]
                       font-bold
                       uppercase
                       tracking-wider
                       mb-1"
              >
                Adoção
              </span>

              <h2
                class="text-texto
                       font-bold
                       text-lg
                       leading-none"
              >
                Como funciona?
              </h2>

              <p class="text-subtexto text-[11px] mt-1">
                Veja as etapas para encontrar seu novo amigo.
              </p>

            </div>


            <!-- Etapas -->
            <div class="flex flex-col">

              <div
                v-for="(passo, indice) in passosAdocao"
                :key="passo.titulo"
                class="relative flex gap-3"
              >

                <!-- Linha entre etapas -->
                <div
                  v-if="indice < passosAdocao.length - 1"
                  class="absolute
                         left-[17px]
                         top-9
                         bottom-0
                         w-[2px]
                         bg-roxo-claro"
                ></div>


                <!-- Ícone -->
                <div
                  class="w-9 h-9
                         rounded-full
                         bg-roxo-claro
                         text-roxo
                         flex
                         items-center
                         justify-center
                         shrink-0
                         relative
                         z-10"
                >
                  <i :class="`bi bi-${passo.icone}`"></i>
                </div>


                <!-- Texto -->
                <div class="pb-5">

                  <p
                    class="font-bold
                           text-texto
                           text-xs
                           leading-tight"
                  >
                    {{ passo.titulo }}
                  </p>

                  <p
                    class="text-subtexto
                           text-[10px]
                           leading-relaxed
                           mt-1"
                  >
                    {{ passo.descricao }}
                  </p>

                </div>

              </div>

            </div>


            <!-- Botão -->
            <BotaoBase
              variante="roxo"
              icone="person-plus"
              bloco
              class="mt-2"
              @click="irParaCadastro"
            >
              Quero me cadastrar
            </BotaoBase>

          </div>

        </aside>


        <!-- =====================================================
             COLUNA DIREITA
        ====================================================== -->
        <div class="flex-1 min-w-0">

          <!-- ===================================================
               CATEGORIAS
          ==================================================== -->
          <div
            class="flex
                   justify-center
                   gap-6 md:gap-10
                   mb-8
                   flex-wrap"
          >

            <button
              v-for="categoria in categorias"
              :key="categoria.valor"
              class="flex
                     flex-col
                     items-center
                     gap-2
                     cursor-pointer
                     group
                     bg-transparent
                     border-0"
              @click="irComFiltro(categoria.valor)"
            >

              <div
                class="w-20 h-20
                       rounded-full
                       overflow-hidden
                       ring-[3px]
                       ring-roxo-claro
                       group-hover:ring-roxo
                       group-hover:scale-105
                       transition-all
                       duration-200
                       shadow-md"
              >
                <img
                  :src="categoria.imagem"
                  :alt="categoria.label"
                  class="w-full h-full object-cover"
                />
              </div>

              <span
                class="text-sm
                       font-semibold
                       text-texto
                       group-hover:text-roxo
                       transition-colors"
              >
                {{ categoria.label }}
              </span>

            </button>

          </div>


          <!-- ===================================================
               CABEÇALHO ANIMAIS
          ==================================================== -->
          <div class="mb-5">

            <span
              class="inline-block
                     border-2
                     border-laranja
                     text-laranja
                     rounded-full
                     px-4
                     py-0.5
                     text-xs
                     font-bold
                     mb-2"
            >
              Adoção
            </span>

            <h2
              class="text-2xl
                     font-bold
                     uppercase
                     text-texto"
            >
              Esperando por você
            </h2>

            <p class="text-subtexto text-xs mt-1">
              Conheça alguns dos animais que estão procurando
              um novo lar.
            </p>

          </div>


          <!-- ===================================================
               GRID ANIMAIS
          ==================================================== -->
          <div
            class="grid
                   grid-cols-1
                   sm:grid-cols-2
                   xl:grid-cols-3
                   gap-4
                   mb-8"
          >

            <PetCard
              v-for="animal in animaisDestaque"
              :key="animal.id"
              :animal="animal"
              @adotar="solicitarAdocao"
            />

          </div>


          <!-- Ver todos -->
          <div class="text-center">

            <BotaoBase
              variante="roxo"
              icone="grid"
              class="px-8"
              @click="irParaAnimais"
            >
              Ver todos os animais
            </BotaoBase>

          </div>

        </div>
      </div>

    </section>


    <!-- =========================================================
         FAQ
    ========================================================== -->
    <section
      id="faq"
      class="max-w-6xl mx-auto px-6 pb-12"
    >

      <div class="mb-6">

        <span
          class="inline-block
                 border-2
                 border-laranja
                 text-laranja
                 rounded-pill
                 px-4
                 py-0.5
                 text-xs
                 font-bold
                 mb-2"
        >
          FAQ
        </span>

        <h2
          class="text-3xl
                 font-bold
                 uppercase
                 text-texto"
        >
          Dúvidas?
          <br />
          A gente responde
        </h2>

        <p class="text-subtexto text-sm mt-1">
          Tudo o que você precisa saber para solicitar
          uma adoção e acompanhar o processo.
        </p>

      </div>


      <div class="flex flex-col md:flex-row gap-8">

        <!-- Abas -->
        <div
          class="flex
                 flex-row
                 md:flex-col
                 gap-2
                 shrink-0"
        >

          <button
            v-for="aba in abasFaq"
            :key="aba.valor"
            :class="[
              'border-2 border-laranja rounded-pill px-5 py-2 text-sm font-semibold transition-colors cursor-pointer',

              abaAtiva === aba.valor
                ? 'bg-laranja text-white'
                : 'bg-transparent text-laranja hover:bg-laranja hover:text-white',
            ]"
            @click="trocarAba(aba.valor)"
          >
            {{ aba.label }}
          </button>

        </div>


        <!-- Perguntas -->
        <div class="flex-1 flex flex-col gap-2.5">

          <div
            v-for="(item, indice) in perguntasAtivas"
            :key="item.pergunta"
            class="bg-white
                   rounded-xl
                   shadow-suave
                   overflow-hidden"
          >

            <button
              class="w-full
                     flex
                     justify-between
                     items-center
                     px-5
                     py-4
                     text-sm
                     font-medium
                     text-texto
                     text-left
                     cursor-pointer
                     bg-transparent
                     border-0
                     hover:text-roxo
                     transition-colors"
              @click="togglePergunta(indice)"
            >

              {{ item.pergunta }}

              <i
                :class="`
                  bi
                  bi-${perguntaAberta === indice ? 'dash-lg' : 'plus-lg'}
                  text-roxo
                  shrink-0
                  ml-3
                `"
              ></i>

            </button>


            <div
              v-if="perguntaAberta === indice"
              class="px-5
                     pb-4
                     text-xs
                     text-subtexto
                     leading-relaxed"
            >
              {{ item.resposta }}
            </div>

          </div>

        </div>

      </div>

    </section>

  </main>
</template>


<script setup lang="ts">

import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'

import PetCard from '@/entities/pet/ui/PetCard.vue'
import BotaoBase from '@/shared/ui/button/BaseButton.vue'

import type { Pet } from '@/entities/pet/model/pet.types'

import Logo from '@/shared/assets/imagens/imagem-banner-hero.png'

import cachorroPequeno from '@/shared/assets/imagens/cachorro-filhote-1.jpg'
import cachorroMedio from '@/shared/assets/imagens/cachorro-2.jpg'
import cachorroGrande from '@/shared/assets/imagens/cachorro-1.jpg'
import gato from '@/shared/assets/imagens/gato-1.jpg'


const roteador = useRouter()


/* ============================================================
   TIPOS DA HOME
============================================================ */

type CategoriaValor =
  | 'Pequeno'
  | 'Médio'
  | 'Grande'
  | 'Felino'

type AbaFaq =
  | 'adocao'
  | 'projeto'


interface Categoria {
  label: string
  valor: CategoriaValor
  imagem: string
}


interface PassoAdocao {
  titulo: string
  descricao: string
  icone: string
}


interface PerguntaFaq {
  pergunta: string
  resposta: string
}


interface AbaFaqItem {
  label: string
  valor: AbaFaq
}


/* ============================================================
   CATEGORIAS
============================================================ */

const categorias: Categoria[] = [
  {
    label: 'Porte Pequeno',
    valor: 'Pequeno',
    imagem: cachorroPequeno,
  },
  {
    label: 'Porte Médio',
    valor: 'Médio',
    imagem: cachorroMedio,
  },
  {
    label: 'Porte Grande',
    valor: 'Grande',
    imagem: cachorroGrande,
  },
  {
    label: 'Felinos',
    valor: 'Felino',
    imagem: gato,
  },
]


/* ============================================================
   PASSOS DA ADOÇÃO
============================================================ */

const passosAdocao: PassoAdocao[] = [
  {
    titulo: 'Crie sua conta',
    descricao:
      'Faça seu cadastro para iniciar uma solicitação de adoção.',
    icone: 'person-plus',
  },

  {
    titulo: 'Escolha um animal',
    descricao:
      'Conheça os animais disponíveis e encontre seu novo amigo.',
    icone: 'heart',
  },

  {
    titulo: 'Envie a solicitação',
    descricao:
      'Preencha as informações necessárias para iniciar o processo.',
    icone: 'file-earmark-text',
  },

  {
    titulo: 'Acompanhe a adoção',
    descricao:
      'Consulte pela sua conta todas as etapas da solicitação.',
    icone: 'clipboard-check',
  },
]


/* ============================================================
   ANIMAIS

   Temporário enquanto a API/store ainda não está conectada.
============================================================ */

const animais: Pet[] = [
  {
    id: 1,
    nome: 'Mel',
    especie: 'Cachorro',
    porte: 'Pequeno',
    cidade: 'Joinville',
    castrado: true,
    genero: 'Fêmea',
    idade: '2 anos',
    descricao:
      'Mel é carinhosa, tranquila e está esperando uma família.',
    imagens: ['/pets/mel.jpg'],
    disponivel: true,
  },

  {
    id: 2,
    nome: 'Thor',
    especie: 'Cachorro',
    porte: 'Grande',
    cidade: 'Joinville',
    castrado: true,
    genero: 'Macho',
    idade: '3 anos',
    descricao:
      'Thor é companheiro, brincalhão e adora estar perto das pessoas.',
    imagens: ['/pets/thor.jpg'],
    disponivel: true,
  },

  {
    id: 3,
    nome: 'Luna',
    especie: 'Gato',
    porte: 'Pequeno',
    cidade: 'Joinville',
    castrado: true,
    genero: 'Fêmea',
    idade: '1 ano',
    descricao:
      'Luna é dócil, curiosa e está procurando um novo lar.',
    imagens: ['/pets/luna.jpg'],
    disponivel: true,
  },
]


const animaisDestaque = computed(() => {
  return animais
    .filter((animal) => animal.disponivel)
    .slice(0, 6)
})


/* ============================================================
   FAQ
============================================================ */

const abaAtiva = ref<AbaFaq>('adocao')

const perguntaAberta = ref<number | null>(null)


const abasFaq: AbaFaqItem[] = [
  {
    label: 'Para Adotantes',
    valor: 'adocao',
  },
  {
    label: 'Sobre o projeto',
    valor: 'projeto',
  },
]


const todasPerguntas: Record<AbaFaq, PerguntaFaq[]> = {

  adocao: [
    {
      pergunta: 'Preciso criar uma conta para solicitar uma adoção?',
      resposta:
        'Sim. O cadastro permite identificar o adotante, enviar a solicitação e acompanhar todas as etapas do processo.',
    },

    {
      pergunta: 'Como faço para solicitar a adoção de um animal?',
      resposta:
        'Escolha um animal disponível, acesse seus detalhes e clique em Adotar. Depois, preencha as informações solicitadas.',
    },

    {
      pergunta: 'Onde acompanho minha solicitação?',
      resposta:
        'Depois de entrar na sua conta, acesse Minhas Adoções para acompanhar o status e as atualizações do processo.',
    },

    {
      pergunta: 'Enviar uma solicitação significa que a adoção foi aprovada?',
      resposta:
        'Não. A solicitação inicia o processo de análise. O andamento poderá ser acompanhado pela plataforma.',
    },
  ],


  projeto: [
    {
      pergunta: 'Qual é o objetivo do AdotPets?',
      resposta:
        'O AdotPets facilita a divulgação dos animais disponíveis e organiza o processo de solicitação e acompanhamento das adoções.',
    },

    {
      pergunta: 'Posso acompanhar todas as etapas da adoção?',
      resposta:
        'Sim. O sistema permite consultar o andamento da solicitação pela área do usuário.',
    },

    {
      pergunta: 'Os animais exibidos estão disponíveis para adoção?',
      resposta:
        'A página apresenta os animais com status disponível. O status poderá ser atualizado conforme o andamento das adoções.',
    },
  ],
}


const perguntasAtivas = computed(() => {
  return todasPerguntas[abaAtiva.value]
})


/* ============================================================
   NAVEGAÇÃO
============================================================ */

function irParaAnimais() {
  roteador.push('/adotar')
}


function irParaCadastro() {
  roteador.push('/cadastro')
}


function irParaMinhasAdocoes() {
  roteador.push('/minhas-adocoes')
}


function irComFiltro(categoria: CategoriaValor) {

  roteador.push({
    path: '/adotar',

    query: {
      categoria,
    },
  })
}


function solicitarAdocao(animal: Pet) {

  roteador.push({
    name: 'animal-detalhe',

    params: {
      id: animal.id,
    },
  })
}


/* ============================================================
   FAQ
============================================================ */

function trocarAba(aba: AbaFaq) {

  abaAtiva.value = aba

  perguntaAberta.value = null
}


function togglePergunta(indice: number) {

  perguntaAberta.value =
    perguntaAberta.value === indice
      ? null
      : indice
}

</script>