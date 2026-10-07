import { z } from 'zod'

const envSchema = z.object({
  NODE_ENV: z
    .enum(['development', 'test', 'production'])
    .default('development'),

  PORT: z.coerce
    .number()
    .int()
    .positive()
    .default(3000),

  DB_HOST: z
    .string()
    .min(1),

  DB_PORT: z.coerce
    .number()
    .int()
    .positive()
    .default(3306),

  DB_USER: z
    .string()
    .min(1),

  DB_PASSWORD: z
    .string(),

  DB_NAME: z
    .string()
    .min(1),

  JWT_SECRET: z
    .string()
    .min(32, 'JWT_SECRET deve possuir pelo menos 32 caracteres'),

  FRONTEND_URL: z
    .string()
    .url()
    .default('http://localhost:5173'),
})

const resultado = envSchema.safeParse(process.env)

if (!resultado.success) {
  console.error('Variáveis de ambiente inválidas:')

  console.error(
    resultado.error.flatten().fieldErrors,
  )

  process.exit(1)
}

export const env = resultado.data