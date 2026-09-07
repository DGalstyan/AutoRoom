-- CreateEnum
CREATE TYPE "LeadStatus" AS ENUM ('NEW', 'CONTACTED', 'CLOSED');

-- CreateTable
CREATE TABLE "leads" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT,
    "topic" TEXT,
    "interest" TEXT,
    "budget" TEXT,
    "financing" TEXT,
    "timing" TEXT,
    "channel" TEXT,
    "color" TEXT,
    "comment" TEXT,
    "carName" TEXT,
    "carVin" TEXT,
    "sourcePage" TEXT NOT NULL,
    "sourceCta" TEXT NOT NULL,
    "locale" TEXT NOT NULL,
    "device" TEXT NOT NULL,
    "quizAnswersJson" JSONB,
    "status" "LeadStatus" NOT NULL DEFAULT 'NEW',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "leads_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "leads_status_createdAt_idx" ON "leads"("status", "createdAt");
