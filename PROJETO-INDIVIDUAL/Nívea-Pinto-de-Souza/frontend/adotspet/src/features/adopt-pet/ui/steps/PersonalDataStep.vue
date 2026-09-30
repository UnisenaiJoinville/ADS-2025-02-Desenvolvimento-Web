<template>
  <div>
    <h3
      class="mb-0.5 text-base font-bold text-texto"
    >
      Dados pessoais
    </h3>

    <p class="mb-5 text-xs text-subtexto">
      Preencha suas informações para seguirmos
      com a adoção.
    </p>

    <div
      class="mb-4 grid grid-cols-1 gap-4 md:grid-cols-2"
    >
      <BaseInput
        v-model="form.nome"
        rotulo="Nome"
      />

      <BaseInput
        v-model="form.sobrenome"
        rotulo="Sobrenome"
      />
    </div>

    <div
      class="mb-4 grid grid-cols-1 gap-4 md:grid-cols-2"
    >
      <BaseInput
        v-model="form.dataNascimento"
        rotulo="Data de Nascimento"
        tipo="date"
      />

      <div class="w-full">
        <label :class="classeRotulo">
          Estado Civil
        </label>

        <select
          v-model="form.estadoCivil"
          :class="classeSelect"
        >
          <option value="">
            Selecione...
          </option>

          <option
            v-for="opcao in estadosCivis"
            :key="opcao"
            :value="opcao"
          >
            {{ opcao }}
          </option>
        </select>
      </div>
    </div>

    <div class="mb-4 max-w-xs">
      <BaseInput
        v-model="form.cpf"
        rotulo="CPF"
        placeholder="000.000.000-00"
      />
    </div>

    <div
      class="mb-5 grid grid-cols-1 gap-4 md:grid-cols-2"
    >
      <BaseInput
        v-model="form.email"
        rotulo="Email"
        tipo="email"
      />

      <BaseInput
        v-model="form.whatsapp"
        rotulo="Número Whatsapp"
        placeholder="(47) 99999-9999"
      />
    </div>

    <div class="w-full">
      <label :class="classeRotulo">
        Documento com foto
      </label>

      <div
        :class="[
          classeUpload,
          dragAtivo
            ? 'border-roxo bg-roxo-claro'
            : 'border-gray-200 hover:border-roxo/50',
        ]"
        @dragover.prevent="dragAtivo = true"
        @dragleave="dragAtivo = false"
        @drop.prevent="aoSoltarArquivo"
        @click="selecionarArquivo"
      >
        <i
          class="bi bi-file-earmark-text mb-2 block text-4xl text-subtexto"
        ></i>

        <p
          v-if="!form.documento"
          class="text-sm font-medium text-texto"
        >
          Arraste e solte seus arquivos aqui
        </p>

        <p
          v-else
          class="text-sm font-semibold text-roxo"
        >
          {{ form.documento.name }}
        </p>

        <p class="mt-1 text-xs text-subtexto">
          Formatos aceitos: JPEG, PNG, PDF e
          MP4, com até 50MB
        </p>

        <BaseButton
          tipo="button"
          variante="outline"
          class="mt-3"
        >
          Escolher Arquivo
        </BaseButton>
      </div>

      <input
        ref="inputArquivo"
        type="file"
        accept=".jpg,.jpeg,.png,.pdf,.mp4"
        class="hidden"
        @change="aoEscolherArquivo"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

import { BaseButton } from '@/shared/ui/button'
import { BaseInput } from '@/shared/ui/input'

import type {
  AdoptionFormData,
} from '../../model/adoption.types'

const form =
  defineModel<AdoptionFormData>('form', {
    required: true,
  })

const dragAtivo = ref(false)

const inputArquivo =
  ref<HTMLInputElement | null>(null)

const estadosCivis = [
  'Solteiro(a)',
  'Casado(a)',
  'Divorciado(a)',
  'Viúvo(a)',
  'União estável',
]

const classeRotulo =
  'mb-1.5 block text-sm font-semibold text-subtexto'

const classeSelect =
  'w-full cursor-pointer rounded-pill border-[1.5px] border-gray-200 bg-fundo px-5 py-3 text-sm text-texto outline-none focus:border-roxo'

const classeUpload =
  'cursor-pointer rounded-xl border-2 border-dashed p-8 text-center transition-colors'

function selecionarArquivo() {
  inputArquivo.value?.click()
}

function definirArquivo(
  arquivo: File | undefined,
) {
  if (arquivo) {
    form.value.documento = arquivo
  }
}

function aoSoltarArquivo(event: DragEvent) {
  dragAtivo.value = false

  definirArquivo(
    event.dataTransfer?.files[0],
  )
}

function aoEscolherArquivo(event: Event) {
  const input =
    event.target as HTMLInputElement

  definirArquivo(input.files?.[0])
}
</script>