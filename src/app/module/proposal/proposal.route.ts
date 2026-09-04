import { Router } from "express";
import { auth } from "../../middleware/checkAuth";
import { UserRoles } from "../../../generated/prisma/enums";
import { ProposalController } from "./proposal.controller";

const router = Router();

router.post("/", auth(UserRoles.FREELANCER), ProposalController.submitProposal);

router.get(
    "/freelancer/my-proposals",
    auth(UserRoles.FREELANCER),
    ProposalController.getFreelancerProposals
);
router.get("/job/:jobId", auth(UserRoles.CLIENT), ProposalController.getProposalsForJob);
router.get("/:proposalId", auth(UserRoles.CLIENT, UserRoles.FREELANCER), ProposalController.getProposalById);

router.post(
    "/:proposalId/withdraw",
    auth(UserRoles.FREELANCER),
    ProposalController.withdrawProposal
);
router.post(
    "/:proposalId/counter-offer",
    auth(UserRoles.CLIENT),
    ProposalController.createCounterOffer
);
router.post(
    "/counter-offer/:counterOfferId/accept",
    auth(UserRoles.FREELANCER),
    ProposalController.acceptCounterOffer
);
router.post(
    "/counter-offer/:counterOfferId/reject",
    auth(UserRoles.FREELANCER),
    ProposalController.rejectCounterOffer
);

export const ProposalRoutes = router;