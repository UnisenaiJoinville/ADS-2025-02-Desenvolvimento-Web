import cors from 'cors'
import express from 'express'
import helmet from 'helmet'
import { rateLimit } from 'express-rate-limit'
import pinoHttp from 'pino-http'

import { env } from './config/env.js'

export const app = express()

app.disable('x-powered-by')

app.use(
  helmet(),
)

app.use(
  cors({
    origin: env.FRONTEND_URL,
    credentials: true,
  }),
)

app.use(
  express.json({
    limit: '1mb',
  }),
)

app.use(
  pinoHttp(),
)

app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 200,
    standardHeaders: true,
    legacyHeaders: false,
  }),
)

app.get('/health', (_req, res) => {
  return res.status(200).json({
    status: 'ok',
    application: 'adotspet-api',
    timestamp: new Date().toISOString(),
  })
})