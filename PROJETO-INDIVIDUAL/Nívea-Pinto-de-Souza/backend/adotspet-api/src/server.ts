import { app } from './app.js'

import { env } from './config/env.js'
import { testarConexaoBanco } from './config/database.js'

async function iniciarServidor() {
  try {
    await testarConexaoBanco()

    app.listen(env.PORT, () => {
      console.log(
        `API AdotPets executando em http://localhost:${env.PORT}`,
      )
    })
  } catch (error) {
    console.error(
      'Erro ao iniciar a aplicação:',
      error,
    )

    process.exit(1)
  }
}

iniciarServidor()