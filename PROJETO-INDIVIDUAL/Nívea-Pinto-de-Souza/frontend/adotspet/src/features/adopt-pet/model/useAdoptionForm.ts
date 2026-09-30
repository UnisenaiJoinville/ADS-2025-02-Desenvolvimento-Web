import { ref } from 'vue'

import type {
  AdoptionFormData,
  AdoptionStep,
} from './adoption.types'

function criarFormularioInicial(): AdoptionFormData {
  return {
    nome: '',
    sobrenome: '',
    dataNascimento: '',
    estadoCivil: '',
    cpf: '',
    email: '',
    whatsapp: '',
    documento: null,

    cep: '',
    numero: '',
    rua: '',
    bairro: '',
    cidade: '',
    estado: '',
    complemento: '',

    tipoMoradia: '',
    tipoImovel: '',
    contratoPermiteAnimais: '',

    possuiQuintal: '',
    quintalFechado: '',
    alguemAlergia: '',
    pessoasResidencia: 1,

    possuiOutrosAnimais: '',
    quantosAnimais: 1,
    especiesAnimais: '',
    saoCastrados: '',
    saoVacinados: '',
    observacaoAnimais: '',

    devolveuAnimal: '',
    horasSozinho: 0,

    custos: {
      racao: false,
      vacinas: false,
      veterinario: false,
      castracao: false,
      emergencias: false,
    },

    rendaMensal: '',
    motivoAdocao: '',
    permiteVisitas: '',
    concordaTermos: '',
    declaraVeracidade: false,
  }
}

export function useAdoptionForm() {
  const etapa = ref(1)

  const form = ref<AdoptionFormData>(
    criarFormularioInicial(),
  )

  const passos: AdoptionStep[] = [
    {
      numero: 1,
      label: 'Dados Pessoais',
    },
    {
      numero: 2,
      label: 'Endereço',
    },
    {
      numero: 3,
      label: 'Detalhes Sobre O Ambiente',
    },
  ]

  function proximaEtapa() {
    if (etapa.value < 3) {
      etapa.value++
    }
  }

  function etapaAnterior() {
    if (etapa.value > 1) {
      etapa.value--
    }
  }

  function concluirFormulario() {
    etapa.value = 4
  }

  function voltarEdicao() {
    etapa.value = 1
  }

  function salvarRascunho() {
    const {
      documento,
      ...dados
    } = form.value

    localStorage.setItem(
      'adoption-form-draft',
      JSON.stringify(dados),
    )
  }

  function resetarFormulario() {
    form.value = criarFormularioInicial()
    etapa.value = 1
  }

  return {
    etapa,
    form,
    passos,
    proximaEtapa,
    etapaAnterior,
    concluirFormulario,
    voltarEdicao,
    salvarRascunho,
    resetarFormulario,
  }
}