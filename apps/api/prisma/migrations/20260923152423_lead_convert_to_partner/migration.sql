-- AlterTable
ALTER TABLE "leads" ADD COLUMN     "convertedPartnerId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "leads_convertedPartnerId_key" ON "leads"("convertedPartnerId");

-- AddForeignKey
ALTER TABLE "leads" ADD CONSTRAINT "leads_convertedPartnerId_fkey" FOREIGN KEY ("convertedPartnerId") REFERENCES "partners"("id") ON DELETE SET NULL ON UPDATE CASCADE;
