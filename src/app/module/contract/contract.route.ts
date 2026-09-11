import { Router } from "express";
import { auth } from "../../middleware/checkAuth";
import { UserRoles } from "../../../generated/prisma/enums";
import { ContractController } from "./contract.controller";

const router = Router()

router.post(
    "/accept-proposal",
    auth(UserRoles.CLIENT),
    ContractController.acceptProposal
);

router.get("/:contractId",
    auth(UserRoles.CLIENT, UserRoles.FREELANCER, UserRoles.ADMIN),
    ContractController.getContract
);

router.get("/",
    auth(UserRoles.CLIENT, UserRoles.FREELANCER),
    ContractController.getMyContracts
);

router.patch(
    "/:contractId/mark-complete",
    auth(UserRoles.CLIENT),
    ContractController.markAsComplete
);

export const ContractRoutes = router;