import { Router } from "express";
import { JobController } from "./job.controller";
import { auth } from "../../middleware/checkAuth";
import { UserRoles } from "../../../generated/prisma/enums";

const router = Router()

// router.get('/', JobController.)

router.post('/', auth(UserRoles.CLIENT), JobController.createJob)
router.delete('/:id', auth(UserRoles.CLIENT), JobController.deleteJob)

export const JobRoutes = router