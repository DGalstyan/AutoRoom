-- CreateEnum
CREATE TYPE "MeetingStatus" AS ENUM ('PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED');

-- AlterTable
ALTER TABLE "leads" ADD COLUMN     "meetingConfirmedAt" TIMESTAMP(3),
ADD COLUMN     "meetingNote" TEXT,
ADD COLUMN     "meetingPreviousAt" TIMESTAMP(3),
ADD COLUMN     "meetingStatus" "MeetingStatus",
ADD COLUMN     "phoneVerifiedAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "phone_verifications" (
    "id" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "codeHash" TEXT NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "verifiedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "phone_verifications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "phone_verifications_phone_createdAt_idx" ON "phone_verifications"("phone", "createdAt");

-- CreateIndex
CREATE INDEX "leads_meetingStatus_meetingAt_idx" ON "leads"("meetingStatus", "meetingAt");

-- Meetings already requested before status tracking existed are awaiting staff.
UPDATE "leads" SET "meetingStatus" = 'PENDING' WHERE "meetingAt" IS NOT NULL;
