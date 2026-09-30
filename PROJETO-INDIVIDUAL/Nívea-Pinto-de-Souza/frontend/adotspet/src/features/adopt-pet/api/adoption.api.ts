interface ViaCepResponse {
  erro?: boolean
  logradouro: string
  bairro: string
  localidade: string
  uf: string
}

export interface AddressResponse {
  rua: string
  bairro: string
  cidade: string
  estado: string
}

export async function buscarCep(
  cep: string,
): Promise<AddressResponse> {
  const apenasNumeros = cep.replace(/\D/g, '')

  if (apenasNumeros.length !== 8) {
    throw new Error('CEP inválido')
  }

  const response = await fetch(
    `https://viacep.com.br/ws/${apenasNumeros}/json/`,
  )

  if (!response.ok) {
    throw new Error('Erro ao buscar CEP')
  }

  const dados =
    (await response.json()) as ViaCepResponse

  if (dados.erro) {
    throw new Error('CEP não encontrado')
  }

  return {
    rua: dados.logradouro,
    bairro: dados.bairro,
    cidade: dados.localidade,
    estado: dados.uf,
  }
}