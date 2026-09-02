import cookieParser from 'cookie-parser'
import cors from 'cors'
import express, { Application, Request, Response } from 'express'
import httpStatus from "http-status"
import config from './app/envConfig'
import { globalErrorHandler } from './app/middleware/globalErrorHandler'
import { notFound } from './app/middleware/notFound'
import { AuthRoutes } from './app/module/auth/auth.route'
import { JobRoutes } from './app/module/job/job.route'

const app: Application = express()

app.use(
    cors({
        origin: config.client_url,
        credentials: true,
    }),
)

app.use(express.urlencoded({ extended: true }))

app.use(express.json())
app.use(cookieParser())

app.use('/api/v1/auth', AuthRoutes)
app.use('/api/v1/jobs', JobRoutes)

app.get('/', async (req: Request, res: Response) => {
    res.status(httpStatus.OK).json({
        success: true,
        message: 'workmatch server running...',
    })
})

app.use(globalErrorHandler)
app.use(notFound)

export default app
