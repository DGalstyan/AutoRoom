-- CreateEnum
CREATE TYPE "MeetingFormat" AS ENUM ('ONLINE', 'OFFICE', 'OTHER');

-- AlterTable
ALTER TABLE "leads" ADD COLUMN     "activityType" TEXT,
ADD COLUMN     "company" TEXT,
ADD COLUMN     "meetingAddress" TEXT,
ADD COLUMN     "meetingAt" TIMESTAMP(3),
ADD COLUMN     "meetingBranchId" TEXT,
ADD COLUMN     "meetingFormat" "MeetingFormat",
ADD COLUMN     "meetingSlotId" TEXT;

-- CreateIndex
CREATE INDEX "leads_meetingSlotId_idx" ON "leads"("meetingSlotId");

-- CreateIndex
CREATE INDEX "leads_meetingBranchId_idx" ON "leads"("meetingBranchId");

-- AddForeignKey
ALTER TABLE "leads" ADD CONSTRAINT "leads_meetingSlotId_fkey" FOREIGN KEY ("meetingSlotId") REFERENCES "availability_slots"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leads" ADD CONSTRAINT "leads_meetingBranchId_fkey" FOREIGN KEY ("meetingBranchId") REFERENCES "branches"("id") ON DELETE SET NULL ON UPDATE CASCADE;
