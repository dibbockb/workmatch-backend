import { Prisma } from "../../generated/prisma/client";

export const logAction = async (
    tx: Prisma.TransactionClient,
    userId: string | null,
    action: string,
    entityType: string,
    entityId: string,
    changes?: any
) => {
    await tx.auditLog.create({
        data: {
            userId,
            action,
            entityType,
            entityId,
            changes: changes ?? null,
        },
    });
};