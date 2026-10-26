import type { AdoptionStatus } from './adocao.status'

export interface Adoption {
  id: number
  petId: number
  userId: number
  status: AdoptionStatus
  criadoEm: string
}