export interface Pet {
  id: number
  nome: string
  especie: string
  porte: string
  cidade: string
  castrado: boolean
  genero: 'Macho' | 'Fêmea'
  idade: string
  descricao: string
  imagens: string[]
  disponivel: boolean
}