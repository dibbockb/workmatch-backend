import { Router } from "express";
import { auth } from "../../middleware/checkAuth";
import { UserRoles } from "../../../generated/prisma/enums";
import { AdminController } from "./admin.controller";

const router = Router()

router.get("/users", auth(UserRoles.ADMIN), AdminController.getUsers)
router.get("/stats", auth(UserRoles.ADMIN), AdminController.getDashboard)
router.post("/block/:userId", auth(UserRoles.ADMIN), AdminController.blockUser)

export const AdminRoutes = router;