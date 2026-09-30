<template>
  <div>
    <h3 class="mb-0.5 text-base font-bold text-texto">Endereço</h3>
    
    <p class="mb-5 text-xs text-subtexto">Informe seu endereço para continuarmos o processo de adoção.</p>

    <div class="mb-4 max-w-xs">
      <BaseInput v-model="form.cep" rotulo="CEP" placeholder="00000-000" maxlength="9" @update:model-value="onCepInput"/>
      <p v-if="buscandoCep" class="mt-1 text-xs text-subtexto"><i class="bi bi-arrow-repeat mr-1 animate-spin"></i>Buscando CEP...</p>
      <p v-else-if="form.rua"class="mt-1 text-xs text-green-600"><i class="bi bi-check-circle-fill mr-1"></i>Endereço encontrado</p>
    </div>

    <div
      class="mb-4 grid grid-cols-2 gap-4 md:grid-cols-5"
    >
      <div>
        <BaseInput
          v-model="form.numero"
          rotulo="Número"
        />
      </div>

      <div class="md:col-span-4">
        <BaseInput
          v-model="form.rua"
          rotulo="Rua"
        />
      </div>
    </div>

    <div
      class="mb-4 grid grid-cols-1 gap-4 md:grid-cols-3"
    >
      <BaseInput
        v-model="form.bairro"
        rotulo="Bairro"
      />

      <BaseInput
        v-model="form.cidade"
        rotulo="Cidade"
      />

      <BaseInput
        v-model="form.estado"
        rotulo="Estado"
      />
    </div>

    <div class="mb-6">
      <BaseInput
        v-model="form.complemento"
        rotulo="Complemento"
        placeholder="Casa de esquina"
      />
    </div>

    <h4
      class="mb-4 text-sm font-bold text-texto"
    >
      Informações da Moradia
    </h4>

    <div
      class="mb-4 grid grid-cols-1 gap-5 md:grid-cols-2"
    >
      <div>
        <p :class="classeRotulo">
          Você mora em
        </p>

        <div class="flex flex-wrap gap-4">
          <label
            v-for="opcao in tiposMoradia"
            :key="opcao"
            :class="classeRadio"
          >
            <input
              v-model="form.tipoMoradia"
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
          O imóvel é
        </p>

        <div class="flex flex-wrap gap-4">
          <label
            v-for="opcao in tiposImovel"
            :key="opcao"
            :class="classeRadio"
          >
            <input
              v-model="form.tipoImovel"
              type="radio"
              :value="opcao"
              class="accent-roxo"
            />

            {{ opcao }}
          </label>
        </div>
      </div>
    </div>

    <div
      v-if="form.tipoImovel === 'Alugado'"
      class="mb-4"
    >
      <p :class="classeRotulo">
        O contrato permite animais?
      </p>

      <div class="flex gap-4">
        <label
          v-for="opcao in permissoesContrato"
          :key="opcao"
          :class="classeRadio"
        >
          <input
            v-model="
              form.contratoPermiteAnimais
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
      class="mb-4 grid grid-cols-1 gap-5 md:grid-cols-2"
    >
      <div>
        <p :class="classeRotulo">
          Possui quintal?
        </p>

        <div class="flex gap-4">
          <label
            v-for="opcao in simNao"
            :key="opcao"
            :class="classeRadio"
          >
            <input
              v-model="form.possuiQuintal"
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
          form.possuiQuintal === 'Sim'
        "
      >
        <p :class="classeRotulo">
          O quintal é totalmente fechado?
        </p>

        <div class="flex gap-4">
          <label
            v-for="opcao in simNao"
            :key="opcao"
            :class="classeRadio"
          >
            <input
              v-model="form.quintalFechado"
              type="radio"
              :value="opcao"
              class="accent-roxo"
            />

            {{ opcao }}
          </label>
        </div>
      </div>
    </div>

    <div
      class="mb-4 grid grid-cols-1 gap-5 md:grid-cols-2"
    >
      <div>
        <p :class="classeRotulo">
          Alguém tem alergia a animais?
        </p>

        <div class="flex gap-4">
          <label
            v-for="opcao in simNao"
            :key="opcao"
            :class="classeRadio"
          >
            <input
              v-model="form.alguemAlergia"
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
          Quantas pessoas moram na residência?
        </p>

        <input
          v-model.number="
            form.pessoasResidencia
          "
          type="number"
          min="1"
          :class="classeNumero"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

import { BaseInput } from '@/shared/ui/input'

import {
  buscarCep,
} from '../../api/adoption.api'

import type {
  AdoptionFormData,
} from '../../model/adoption.types'

const form =
  defineModel<AdoptionFormData>('form', {
    required: true,
  })

const buscandoCep = ref(false)

const tiposMoradia = [
  'Casa',
  'Apartamento',
  'Sítio/Chácara',
] as const

const tiposImovel = [
  'Próprio',
  'Alugado',
  'Casa de familiar',
] as const

const permissoesContrato = [
  'Sim',
  'Não',
  'Não sei',
] as const

const simNao = [
  'Sim',
  'Não',
] as const

const classeRotulo =
  'mb-2 text-sm font-semibold text-subtexto'

const classeRadio =
  'flex cursor-pointer items-center gap-1.5 text-sm text-texto'

const classeNumero =
  'w-24 rounded-pill border-[1.5px] border-gray-200 bg-fundo px-5 py-3 text-sm text-texto outline-none focus:border-roxo'

async function onCepInput(
  valor: string,
) {
  const apenasNumeros =
    valor.replace(/\D/g, '')

  if (apenasNumeros.length !== 8) {
    return
  }

  buscandoCep.value = true

  try {
    const endereco =
      await buscarCep(apenasNumeros)

    form.value.rua = endereco.rua
    form.value.bairro = endereco.bairro
    form.value.cidade = endereco.cidade
    form.value.estado = endereco.estado
  } catch {
    form.value.rua = ''
    form.value.bairro = ''
    form.value.cidade = ''
    form.value.estado = ''
  } finally {
    buscandoCep.value = false
  }
}
</script>