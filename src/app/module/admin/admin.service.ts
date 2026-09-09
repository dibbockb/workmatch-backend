import { UserStatus } from "../../../generated/prisma/enums"
import { prisma } from "../../lib/prisma"
import { logAction } from "../../utils/auditlog"

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

const blockUser = async (userId: string, reason: string) => {
    const user = await prisma.user.findUnique({
        where: { id: userId }
    })

    if (!user) {
        throw new Error(`No such user exists`)
    }

    const blocked = await prisma.user.update({
        where: { id: userId },
        data: { status: UserStatus.BLOCKED }
    })

    await logAction(prisma, null, "USER_BLOCKED", "User", userId, { reason });

    return blocked;
}

const unblockUser = async (userId: string, reason: string) => {
    const user = await prisma.user.findUnique({
        where: { id: userId }
    })

    if (!user) {
        throw new Error(`No such user exists`)
    }

    const unblocked = await prisma.user.update({
        where: { id: userId },
        data: { status: UserStatus.ACTIVE }
    })

    await logAction(prisma, null, "USER_UNBLOCKED", "User", userId, { reason });

    return unblocked;
}

const getDashboard = async () => {
    return {
        totalUsers: await prisma.user.count(),
        totalJobs: await prisma.job.count(),
        totalContracts: await prisma.contract.count(),
        totalRevenue:
            await prisma.payment.aggregate({
                _sum: { platformCommission: true }
            })
    }
}

const getAuditLogs = async (page = 1, limit = 20) => {
    const logs = await prisma.auditLog.findMany({
        skip: (page - 1) * limit,
        take: limit,
    })

    return {
        logs,
        total: await prisma.auditLog.count()
    }
}

export const AdminService = {
    getUsers,
    blockUser,
    getDashboard,
    getAuditLogs,
    unblockUser
}