<template>
  <div>
    <h3
      class="mb-0.5 text-base font-bold text-texto"
    >
      Detalhes sobre o ambiente
    </h3>

    <p class="mb-5 text-xs text-subtexto">
      Preencha informações sobre o espaço onde
      o pet irá viver.
    </p>

    <div class="mb-4">
      <p :class="classeRotulo">
        Possui outros animais?
      </p>

      <div class="flex gap-4">
        <label
          v-for="opcao in simNao"
          :key="opcao"
          :class="classeRadio"
        >
          <input
            v-model="
              form.possuiOutrosAnimais
            "
            type="radio"
            :value="opcao"
            class="accent-roxo"
          />

          {{ opcao }}
        </label>
      </div>
    </div>

    <div
      v-if="
        form.possuiOutrosAnimais === 'Sim'
      "
      class="mb-4"
    >
      <p :class="classeRotulo">
        Quantos?
      </p>

      <input
        v-model.number="form.quantosAnimais"
        type="number"
        min="1"
        :class="classeNumero"
      />

      <div class="mt-4">
        <label :class="classeLabel">
          Descreva as espécies desses animais
        </label>

        <textarea
          v-model="form.especiesAnimais"
          rows="3"
          :class="classeTextarea"
        ></textarea>
      </div>

      <div
        class="mt-4 grid grid-cols-1 gap-5 md:grid-cols-2"
      >
        <div>
          <p :class="classeRotulo">
            São castrados?
          </p>

          <div class="flex gap-4">
            <label
              v-for="opcao in simNao"
              :key="opcao"
              :class="classeRadio"
            >
              <input
                v-model="form.saoCastrados"
                type="radio"
                :value="opcao"
                class="accent-roxo"
              />

              {{ opcao }}
            </label>
          </div>
        </div>

        <div>
          <p :class="classeRotulo">
            São vacinados?
          </p>

          <div class="flex gap-4">
            <label
              v-for="opcao in simNao"
              :key="opcao"
              :class="classeRadio"
            >
              <input
                v-model="form.saoVacinados"
                type="radio"
                :value="opcao"
                class="accent-roxo"
              />

              {{ opcao }}
            </label>
          </div>
        </div>
      </div>

      <div class="mt-4">
        <label :class="classeLabel">
          Observação
        </label>

        <textarea
          v-model="form.observacaoAnimais"
          rows="2"
          :class="classeTextarea"
        ></textarea>
      </div>
    </div>

    <h4
      class="mb-4 mt-6 text-sm font-bold text-texto"
    >
      Sobre Outros Animais
    </h4>

    <div
      class="mb-4 grid grid-cols-1 gap-5 md:grid-cols-2"
    >
      <div>
        <p :class="classeRotulo">
          Já devolveu algum animal adotado?
        </p>

        <div class="flex gap-4">
          <label
            v-for="opcao in simNao"
            :key="opcao"
            :class="classeRadio"
          >
            <input
              v-model="form.devolveuAnimal"
              type="radio"
              :value="opcao"
              class="accent-roxo"
            />

            {{ opcao }}
          </label>
        </div>
      </div>

      <div>
        <p :class="classeRotulo">
          O animal ficará sozinho por quantas
          horas por dia?
        </p>

        <input
          v-model.number="form.horasSozinho"
          type="number"
          min="0"
          max="24"
          :class="classeNumero"
        />
      </div>
    </div>

    <div
      class="mb-4 grid grid-cols-1 gap-6 md:grid-cols-2"
    >
      <div>
        <p :class="classeRotulo">
          Está ciente dos custos com:
        </p>

        <div class="flex flex-col gap-2">
          <label
            v-for="custo in opcoesCustos"
            :key="custo.campo"
            class="flex cursor-pointer items-center gap-2"
          >
            <input
              v-model="
                form.custos[custo.campo]
              "
              type="checkbox"
              class="h-4 w-4 accent-roxo"
            />

            <span class="text-sm text-texto">
              {{ custo.label }}
            </span>
          </label>
        </div>
      </div>

      <div>
        <p :class="classeRotulo">
          Renda mensal aproximada:
        </p>

        <div class="flex flex-col gap-2">
          <label
            v-for="opcao in opcoesRenda"
            :key="opcao"
            class="flex cursor-pointer items-center gap-2"
          >
            <input
              v-model="form.rendaMensal"
              type="radio"
              :value="opcao"
              class="accent-roxo"
            />

            <span class="text-sm text-texto">
              {{ opcao }}
            </span>
          </label>
        </div>
      </div>
    </div>

    <div class="mb-4">
      <label :class="classeLabel">
        Por que desejo adotar este animal?
      </label>

      <textarea
        v-model="form.motivoAdocao"
        rows="3"
        :class="classeTextarea"
      ></textarea>
    </div>

    <div class="mb-4">
      <p :class="classeRotulo">
        Está disposto(a) a permitir visitas de
        acompanhamento?
      </p>

      <div class="flex gap-4">
        <label
          v-for="opcao in simNao"
          :key="opcao"
          :class="classeRadio"
        >
          <input
            v-model="form.permiteVisitas"
            type="radio"
            :value="opcao"
            class="accent-roxo"
          />

          {{ opcao }}
        </label>
      </div>
    </div>

    <div class="mb-5">
      <p :class="classeRotulo">
        Concorda em assinar termo de
        responsabilidade?
      </p>

      <div class="flex gap-4">
        <label
          v-for="opcao in simNao"
          :key="opcao"
          :class="classeRadio"
        >
          <input
            v-model="form.concordaTermos"
            type="radio"
            :value="opcao"
            class="accent-roxo"
          />

          {{ opcao }}
        </label>
      </div>
    </div>

    <label
      class="mb-2 flex cursor-pointer items-start gap-3"
    >
      <input
        v-model="form.declaraVeracidade"
        type="checkbox"
        class="mt-0.5 h-4 w-4 shrink-0 accent-roxo"
      />

      <span
        class="text-xs leading-relaxed text-subtexto"
      >
        Declaro que as informações são
        verdadeiras e estou ciente que a ONG
        poderá reprovar a solicitação caso
        identifique inconsistências.
      </span>
    </label>
  </div>
</template>

<script setup lang="ts">
import type {
  AdoptionCosts,
  AdoptionFormData,
  RendaMensal,
} from '../../model/adoption.types'

const form =
  defineModel<AdoptionFormData>('form', {
    required: true,
  })

const simNao = [
  'Sim',
  'Não',
] as const

const opcoesCustos: Array<{
  campo: keyof AdoptionCosts
  label: string
}> = [
  {
    campo: 'racao',
    label: 'Ração',
  },
  {
    campo: 'vacinas',
    label: 'Vacinas',
  },
  {
    campo: 'veterinario',
    label: 'Veterinário',
  },
  {
    campo: 'castracao',
    label: 'Castração',
  },
  {
    campo: 'emergencias',
    label: 'Emergências',
  },
]

const opcoesRenda: Exclude<
  RendaMensal,
  ''
>[] = [
  'Até 1 salário mínimo',
  '1-3 salários',
  '3-5 salários',
  'Acima de 5 salários',
]

const classeRotulo =
  'mb-2 text-sm font-semibold text-subtexto'

const classeLabel =
  'mb-1.5 block text-sm font-semibold text-subtexto'

const classeRadio =
  'flex cursor-pointer items-center gap-1.5 text-sm text-texto'

const classeNumero =
  'w-24 rounded-pill border-[1.5px] border-gray-200 bg-fundo px-5 py-3 text-sm text-texto outline-none focus:border-roxo'

const classeTextarea =
  'w-full resize-none rounded-xl border-[1.5px] border-gray-200 bg-fundo px-4 py-3 text-sm text-texto outline-none transition-all focus:border-roxo'
</script>