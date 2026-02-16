-- CreateEnum
CREATE TYPE "OrganizationRequestStatus" AS ENUM ('pending', 'approved', 'denied', 'failed');

-- CreateTable
CREATE TABLE "OrganizationRequest" (
    "id" UUID NOT NULL,
    "requesterUserId" TEXT NOT NULL,
    "requesterEmail" TEXT,
    "organizationName" TEXT NOT NULL,
    "organizationSlug" TEXT NOT NULL,
    "justification" TEXT NOT NULL,
    "status" "OrganizationRequestStatus" NOT NULL DEFAULT 'pending',
    "decisionReason" TEXT,
    "decisionedByUserId" TEXT,
    "decisionedAt" TIMESTAMP(3),
    "clerkOrganizationId" TEXT,
    "failureCode" TEXT,
    "failureMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OrganizationRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "OrganizationRequest_requesterUserId_status_idx" ON "OrganizationRequest"("requesterUserId", "status");

-- CreateIndex
CREATE INDEX "OrganizationRequest_status_createdAt_idx" ON "OrganizationRequest"("status", "createdAt");

-- CreateIndex
CREATE INDEX "OrganizationRequest_organizationSlug_idx" ON "OrganizationRequest"("organizationSlug");
