/*
  Warnings:

  - You are about to drop the column `stripePaymentIntentId` on the `payments` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[stripeSessionId]` on the table `payments` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "payments_stripePaymentIntentId_key";

-- AlterTable
ALTER TABLE "payments" DROP COLUMN "stripePaymentIntentId",
ADD COLUMN     "stripeSessionId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "payments_stripeSessionId_key" ON "payments"("stripeSessionId");
