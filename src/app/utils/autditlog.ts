import { prisma } from "../lib/prisma";

export const logAction = async (
    userId: string | null,
    action: string,
    entityType: string,
    entityId: string,
    changes?: any
) => {
    await prisma.auditLog.create({
        data: {
            userId,
            action,
            entityType,
            entityId,
            changes: changes || null
        }
    });
};