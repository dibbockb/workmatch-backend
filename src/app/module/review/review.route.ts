import { Router } from "express";
import { auth } from "../../middleware/checkAuth";
import { ReviewController } from "./review.controller";

const router = Router();

router.get("/freelancer/:freelancerId", ReviewController.getFreelancerReviews);
router.get("/client/:clientId", ReviewController.getClientReviews);
router.post("/", auth(), ReviewController.createReview);

export const ReviewRoutes = router;