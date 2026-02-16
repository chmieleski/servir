-- CreateEnum
CREATE TYPE "BillingStatus" AS ENUM ('none', 'trialing', 'active', 'past_due', 'unpaid', 'incomplete', 'canceled');

-- CreateEnum
CREATE TYPE "BillingWebhookEventStatus" AS ENUM ('processed', 'ignored', 'failed');

-- CreateTable
CREATE TABLE "OrganizationBilling" (
    "id" UUID NOT NULL,
    "organizationId" TEXT NOT NULL,
    "provider" TEXT NOT NULL DEFAULT 'clerk',
    "status" "BillingStatus" NOT NULL DEFAULT 'none',
    "planId" TEXT,
    "planSlug" TEXT,
    "subscriptionId" TEXT,
    "customerId" TEXT,
    "currentPeriodStart" TIMESTAMP(3),
    "currentPeriodEnd" TIMESTAMP(3),
    "trialEndsAt" TIMESTAMP(3),
    "cancelAtPeriodEnd" BOOLEAN NOT NULL DEFAULT false,
    "lastEventId" TEXT,
    "lastEventAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OrganizationBilling_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BillingWebhookEvent" (
    "id" UUID NOT NULL,
    "provider" TEXT NOT NULL DEFAULT 'clerk',
    "eventId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "status" "BillingWebhookEventStatus" NOT NULL,
    "failureReason" TEXT,
    "occurredAt" TIMESTAMP(3),
    "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processedAt" TIMESTAMP(3),
    "payloadJson" JSONB NOT NULL,
    "headersJson" JSONB,

    CONSTRAINT "BillingWebhookEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "OrganizationBilling_organizationId_key" ON "OrganizationBilling"("organizationId");

-- CreateIndex
CREATE INDEX "OrganizationBilling_status_idx" ON "OrganizationBilling"("status");

-- CreateIndex
CREATE INDEX "OrganizationBilling_updatedAt_idx" ON "OrganizationBilling"("updatedAt");

-- CreateIndex
CREATE UNIQUE INDEX "BillingWebhookEvent_provider_eventId_key" ON "BillingWebhookEvent"("provider", "eventId");

-- CreateIndex
CREATE INDEX "BillingWebhookEvent_eventType_idx" ON "BillingWebhookEvent"("eventType");

-- CreateIndex
CREATE INDEX "BillingWebhookEvent_status_idx" ON "BillingWebhookEvent"("status");

-- CreateIndex
CREATE INDEX "BillingWebhookEvent_receivedAt_idx" ON "BillingWebhookEvent"("receivedAt");
