export type SimNao = '' | 'Sim' | 'Não'

export type PermissaoContrato =
  | ''
  | 'Sim'
  | 'Não'
  | 'Não sei'

export type TipoMoradia =
  | ''
  | 'Casa'
  | 'Apartamento'
  | 'Sítio/Chácara'

export type TipoImovel =
  | ''
  | 'Próprio'
  | 'Alugado'
  | 'Casa de familiar'

export type RendaMensal =
  | ''
  | 'Até 1 salário mínimo'
  | '1-3 salários'
  | '3-5 salários'
  | 'Acima de 5 salários'

export interface AdoptionCosts {
  racao: boolean
  vacinas: boolean
  veterinario: boolean
  castracao: boolean
  emergencias: boolean
}

export interface AdoptionFormData {
  nome: string
  sobrenome: string
  dataNascimento: string
  estadoCivil: string
  cpf: string
  email: string
  whatsapp: string
  documento: File | null

  cep: string
  numero: string
  rua: string
  bairro: string
  cidade: string
  estado: string
  complemento: string

  tipoMoradia: TipoMoradia
  tipoImovel: TipoImovel
  contratoPermiteAnimais: PermissaoContrato

  possuiQuintal: SimNao
  quintalFechado: SimNao
  alguemAlergia: SimNao
  pessoasResidencia: number

  possuiOutrosAnimais: SimNao
  quantosAnimais: number
  especiesAnimais: string
  saoCastrados: SimNao
  saoVacinados: SimNao
  observacaoAnimais: string

  devolveuAnimal: SimNao
  horasSozinho: number

  custos: AdoptionCosts

  rendaMensal: RendaMensal
  motivoAdocao: string
  permiteVisitas: SimNao
  concordaTermos: SimNao
  declaraVeracidade: boolean
}

export interface AdoptionStep {
  numero: number
  label: string
}