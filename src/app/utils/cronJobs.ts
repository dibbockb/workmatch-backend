import cron from "node-cron";
import { prisma } from "../lib/prisma";
import { JobStatus } from "../../generated/prisma/enums";

export const startCronJobs = () => {
    cron.schedule("*/15 * * * *", async () => {
        try {
            const passedJobs = await prisma.job.findMany({
                where: {
                    status: JobStatus.OPEN,
                    deadline: { lt: new Date() }
                }
            })

            for (const job of passedJobs) {
                await prisma.job.update({
                    where: { id: job.id },
                    data: { status: JobStatus.CLOSED }
                })
            }

            if (passedJobs.length > 0) {
                console.log(`[Cron] Auto-closed ${passedJobs.length} expired jobs`);
            }

        } catch (error) {
            console.error(`[cron] Error auto closing jobs :::`, error);
        }
    })
}