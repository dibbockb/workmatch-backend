/*
  Warnings:

  - You are about to alter the column `averageRating` on the `Client` table. The data in that column could be lost. The data in that column will be cast from `Decimal(65,30)` to `Decimal(3,2)`.

*/
-- AlterTable
ALTER TABLE "Client" ALTER COLUMN "averageRating" SET DATA TYPE DECIMAL(3,2);
