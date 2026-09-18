import { Router } from "express";
import { UserRoles } from "../../../generated/prisma/enums";
import { auth } from "../../middleware/checkAuth";
import { uploadMiddleware } from "../upload/upload.controller";
import { AuthController } from "./auth.controller";

const router = Router();

router.post("/register", uploadMiddleware, AuthController.registerUser);
router.post("/login", AuthController.loginUser);
router.post("/logout", AuthController.logout);
router.get(
	"/me",
	auth(UserRoles.ADMIN, UserRoles.CLIENT, UserRoles.FREELANCER),
	AuthController.getMe,
);
router.post("/refresh-token", AuthController.refreshToken);

export const AuthRoutes = router;
