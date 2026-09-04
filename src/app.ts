import cookieParser from 'cookie-parser'
import cors from 'cors'
import express, { Application, Request, Response } from 'express'
import httpStatus from "http-status"
import config from './app/envConfig'
import { globalErrorHandler } from './app/middleware/globalErrorHandler'
import { notFound } from './app/middleware/notFound'
import { AuthRoutes } from './app/module/auth/auth.route'
import { JobRoutes } from './app/module/job/job.route'
import { ProposalRoutes } from './app/module/proposal/proposal.route'
import { ContractRoutes } from './app/module/contract/contract.route'
import { PaymentRoutes } from './app/module/payment/payment.route'
import helmet from "helmet"
import rateLimiter from "express-rate-limit"
import { PaymentController } from './app/module/payment/payment.controller'

const app: Application = express()
app.post('/api/v1/payment/webhook', express.raw({ type: 'application/json' }), PaymentController.handleWebhook)

app.use(
    cors({
        origin: config.client_url,
        credentials: true,
    }),
)

app.use(helmet());
app.use(express.urlencoded({ extended: true }))
app.use(express.json())
app.use(cookieParser())

const appRateLimit = rateLimiter({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: "Too many requests from this IP address. Please try again after sometime."
})
app.use('/api/', appRateLimit)

const authRateLimit = rateLimiter({
    windowMs: 15 * 60 * 1000,
    max: 5,
    message: "Too many login attempts. Please try again later."
})
app.use("/api/v1/auth/login", authRateLimit);
app.use("/api/v1/auth/register", authRateLimit);

app.use('/api/v1/auth', AuthRoutes)
app.use('/api/v1/jobs', JobRoutes)
app.use('/api/v1/proposals', ProposalRoutes)
app.use('/api/v1/contracts', ContractRoutes)
app.use('/api/v1/payment', PaymentRoutes)

app.get('/', async (req: Request, res: Response) => {
    res.status(httpStatus.OK).json({
        success: true,
        message: 'workmatch server running...',
    })
})

app.use(globalErrorHandler)
app.use(notFound)

export default app;
