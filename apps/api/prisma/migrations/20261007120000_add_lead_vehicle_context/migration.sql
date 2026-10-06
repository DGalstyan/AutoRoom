-- AlterTable
ALTER TABLE "leads" ADD COLUMN     "carId" TEXT,
ADD COLUMN     "carLot" TEXT,
ADD COLUMN     "submittedAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "leads_carId_idx" ON "leads"("carId");
