import { Router } from 'express'
import { auth } from '../../middleware/checkAuth'
import { AuthController } from './auth.controller'
import { UserRoles } from '../../../generated/prisma/enums'

const router = Router()

router.post('/register', AuthController.registerUser)
router.post('/login', AuthController.loginUser)
router.get(
    '/me',
    auth(UserRoles.ADMIN, UserRoles.CLIENT, UserRoles.FREELANCER),
    AuthController.getMe,
)
router.post('/refresh-token', AuthController.refreshToken)
export const AuthRoutes = router
