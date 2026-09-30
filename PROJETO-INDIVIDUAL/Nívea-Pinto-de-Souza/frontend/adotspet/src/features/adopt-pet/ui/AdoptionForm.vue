<template>
  <div class="flex flex-col gap-4">
    <div
      class="overflow-hidden rounded-card bg-white shadow-suave"
    >
      <div
        class="border-b border-gray-100 px-7 pb-4 pt-6"
      >
        <h2
          class="text-base font-bold text-texto"
        >
          Formulário de Adoção
        </h2>
      </div>

      <AdoptionStepper
        :etapa="etapa"
        :passos="passos"
      />

      <div class="px-7 pb-2">
        <Transition
          mode="out-in"
          enter-active-class="transition-all duration-200 ease-out"
          leave-active-class="transition-all duration-200 ease-in"
          enter-from-class="translate-x-4 opacity-0"
          leave-to-class="-translate-x-4 opacity-0"
        >
          <PersonalDataStep
            v-if="etapa === 1"
            v-model:form="form"
            key="personal"
          />

          <AddressStep
            v-else-if="etapa === 2"
            v-model:form="form"
            key="address"
          />

          <EnvironmentStep
            v-else-if="etapa === 3"
            v-model:form="form"
            key="environment"
          />

          <SuccessStep
            v-else
            key="success"
          />
        </Transition>
      </div>

      <div
        class="flex items-center justify-between border-t border-gray-100 px-7 py-4"
      >
        <span class="text-xs text-subtexto">
          {{
            etapa <= 3
              ? `Etapa ${etapa} de 3`
              : ''
          }}
        </span>

        <div class="flex gap-3">
          <template v-if="etapa === 4">
            <BaseButton
              variante="outline"
              @click="voltarEdicao"
            >
              Editar
            </BaseButton>

            <BaseButton
              variante="roxo"
              @click="concluir"
            >
              Concluir
            </BaseButton>
          </template>

          <template v-else>
            <BaseButton
              v-if="etapa > 1"
              variante="outline"
              @click="etapaAnterior"
            >
              Anterior
            </BaseButton>

            <BaseButton
              v-if="etapa < 3"
              variante="roxo"
              @click="proximaEtapa"
            >
              Próximo
            </BaseButton>

            <BaseButton
              v-if="etapa === 3"
              variante="roxo"
              @click="concluirFormulario"
            >
              Concluir
            </BaseButton>
          </template>
        </div>
      </div>
    </div>

    <BaseButton
      v-if="etapa <= 3"
      variante="laranja"
      bloco
      @click="salvarRascunho"
    >
      Salvar Alterações
    </BaseButton>
  </div>
</template>

<script setup lang="ts">
import { BaseButton } from '@/shared/ui/button'

import { useAdoptionForm } from '../model/useAdoptionForm'

import AdoptionStepper from './AdoptionStepper.vue'
import AddressStep from './steps/AddressStep.vue'
import EnvironmentStep from './steps/EnvironmentStep.vue'
import PersonalDataStep from './steps/PersonalDataStep.vue'
import SuccessStep from './steps/SuccessStep.vue'

const emit = defineEmits<{
  concluido: []
}>()

const {
  etapa,
  form,
  passos,
  proximaEtapa,
  etapaAnterior,
  concluirFormulario,
  voltarEdicao,
  salvarRascunho,
  resetarFormulario,
} = useAdoptionForm()

function concluir() {
  emit('concluido')

  resetarFormulario()
}
</script>