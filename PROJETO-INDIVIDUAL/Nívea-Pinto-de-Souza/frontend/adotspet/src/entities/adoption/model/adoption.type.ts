import type { AdoptionStatus } from './adoption.status'

export interface Adoption {
  id: number
  petId: number
  userId: number
  status: AdoptionStatus
  criadoEm: string
}