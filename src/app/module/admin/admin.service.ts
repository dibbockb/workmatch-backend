import { UserStatus } from "../../../generated/prisma/enums"
import { prisma } from "../../lib/prisma"

const getUsers = async (page = 1, limit = 20) => {
    const users = await prisma.user.findMany({
        skip: (page - 1) * limit,
        take: limit,
        omit: { password: true }
    })

    return {
        users,
        total: await prisma.user.count()
    }
}

const blockUser = async (userId: string) => {
    const user = await prisma.user.findUnique({
        where: { id: userId }
    })

    if (!user) {
        throw new Error(`No such user exists`)
    }

    return await prisma.user.update({
        where: { id: userId },
        data: { status: UserStatus.BLOCKED }
    })
}

const getDashboard = async () => {
    return {
        totalUsers: await prisma.user.count(),
        totalJobs: await prisma.job.count(),
        totalConracts: await prisma.contract.count(),
        totalRevenue:
            await prisma.payment.aggregate({
                _sum: { platformCommission: true }
            })
    }
}

export const AdminService = {
    getUsers,
    blockUser,
    getDashboard
}