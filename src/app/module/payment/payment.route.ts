import { Router } from "express";
import { auth } from "../../middleware/checkAuth";
import { UserRoles } from "../../../generated/prisma/enums";
import { PaymentController } from "./payment.controller";

const router = Router();

router.post(
    "/initiate",
    auth(UserRoles.CLIENT),
    PaymentController.initiatePayment
);

router.get("/verify/:sessionId", auth(UserRoles.ADMIN, UserRoles.CLIENT, UserRoles.FREELANCER), PaymentController.verifySession)
router.get("/:paymentId", auth(UserRoles.CLIENT, UserRoles.FREELANCER), PaymentController.getPayment);

export const PaymentRoutes = router;