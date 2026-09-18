import { Router } from "express";
import { UserRoles } from "../../../generated/prisma/enums";
import { auth } from "../../middleware/checkAuth";
import { validateRequest } from "../../middleware/validateRequest";
import { JobController } from "./job.controller";
import {
	CreateJobValidationSchema,
	UpdateJobValidationSchema,
} from "./job.validation";

const router = Router();

router.get("/", JobController.getJobsList);
router.get("/search", JobController.searchJobs);
router.get("/my-posted", auth(UserRoles.CLIENT), JobController.getMyPostedJobs);
router.get("/:jobId", JobController.getJobById);
router.post(
	"/",
	auth(UserRoles.CLIENT),
	validateRequest(CreateJobValidationSchema),
	JobController.createJob,
);
router.post("/:jobId/close", auth(UserRoles.CLIENT), JobController.closeJob);
router.patch(
	"/:jobId",
	auth(UserRoles.CLIENT),
	validateRequest(UpdateJobValidationSchema),
	JobController.updateJob,
);
router.delete("/:jobId", auth(UserRoles.CLIENT), JobController.deleteJob);

export const JobRoutes = router;
