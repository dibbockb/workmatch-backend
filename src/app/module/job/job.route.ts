import { Router } from "express";
import { JobController } from "./job.controller";
import { auth } from "../../middleware/checkAuth";
import { UserRoles } from "../../../generated/prisma/enums";

const router = Router()

router.get('/', JobController.getJobsList)
router.get('/:jobId', JobController.getJobById)

router.post('/', auth(UserRoles.CLIENT), JobController.createJob)
router.patch('/:jobId', auth(UserRoles.CLIENT), JobController.updateJob)
router.delete('/:jobId', auth(UserRoles.CLIENT), JobController.deleteJob)
router.post('/:jobId/close', auth(UserRoles.CLIENT), JobController.closeJob)
router.get('/my-posted', auth(UserRoles.CLIENT), JobController.getMyPostedJobs)

export const JobRoutes = router