import { Router } from "express";
import { UserRoles } from "../../../generated/prisma/enums";
import { auth } from "../../middleware/checkAuth";
import { PaymentController } from "./payment.controller";

const router = Router();

router.post(
	"/initiate",
	auth(UserRoles.CLIENT),
	PaymentController.initiatePayment,
);

router.get(
	"/verify/:sessionId",
	auth(UserRoles.ADMIN),
	PaymentController.verifySession,
);
router.get(
	"/:paymentId",
	auth(UserRoles.ADMIN, UserRoles.CLIENT, UserRoles.FREELANCER),
	PaymentController.getPayment,
);

export const PaymentRoutes = router;
