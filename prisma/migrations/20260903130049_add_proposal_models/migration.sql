-- CreateEnum
CREATE TYPE "ProposalStatus" AS ENUM ('PENDING', 'ACCEPTED', 'REJECTED', 'WITHDRAWN');

-- CreateEnum
CREATE TYPE "CounterOfferStatus" AS ENUM ('PENDING', 'ACCEPTED', 'REJECTED');

-- CreateEnum
CREATE TYPE "CounterOfferOrigin" AS ENUM ('CLIENT', 'FREELANCER');

-- CreateTable
CREATE TABLE "counter_offers" (
    "id" TEXT NOT NULL,
    "proposalId" TEXT NOT NULL,
    "offeredBy" "CounterOfferOrigin" NOT NULL,
    "proposedPrice" DECIMAL(10,2) NOT NULL,
    "proposedTimeline" INTEGER NOT NULL,
    "message" TEXT,
    "status" "CounterOfferStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "counter_offers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "proposals" (
    "id" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "freelancerId" TEXT NOT NULL,
    "proposedPrice" DECIMAL(10,2) NOT NULL,
    "proposedTimeline" INTEGER NOT NULL,
    "approachDescription" TEXT NOT NULL,
    "status" "ProposalStatus" NOT NULL DEFAULT 'PENDING',
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "respondedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "proposals_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "counter_offers_proposalId_idx" ON "counter_offers"("proposalId");

-- CreateIndex
CREATE INDEX "proposals_jobId_idx" ON "proposals"("jobId");

-- CreateIndex
CREATE INDEX "proposals_freelancerId_idx" ON "proposals"("freelancerId");

-- CreateIndex
CREATE INDEX "proposals_status_idx" ON "proposals"("status");

-- CreateIndex
CREATE UNIQUE INDEX "proposals_jobId_freelancerId_key" ON "proposals"("jobId", "freelancerId");

-- AddForeignKey
ALTER TABLE "counter_offers" ADD CONSTRAINT "counter_offers_proposalId_fkey" FOREIGN KEY ("proposalId") REFERENCES "proposals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "proposals" ADD CONSTRAINT "proposals_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "jobs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "proposals" ADD CONSTRAINT "proposals_freelancerId_fkey" FOREIGN KEY ("freelancerId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
