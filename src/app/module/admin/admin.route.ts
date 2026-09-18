import { Router } from "express";
import { UserRoles } from "../../../generated/prisma/enums";
import { auth } from "../../middleware/checkAuth";
import { AdminController } from "./admin.controller";

const router = Router();

router.get("/users", auth(UserRoles.ADMIN), AdminController.getUsers);

router.patch(
	"/users/:userId/block",
	auth(UserRoles.ADMIN),
	AdminController.blockUser,
);

router.patch(
	"/users/:userId/unblock",
	auth(UserRoles.ADMIN),
	AdminController.unblockUser,
);

router.get("/dashboard", auth(UserRoles.ADMIN), AdminController.getDashboard);

router.get("/audit-logs", auth(UserRoles.ADMIN), AdminController.getAuditLogs);

export const AdminRoutes = router;
