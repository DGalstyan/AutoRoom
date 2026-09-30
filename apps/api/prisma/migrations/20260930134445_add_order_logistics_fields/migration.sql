-- CreateEnum
CREATE TYPE "InspectionStatus" AS ENUM ('PENDING', 'CONFIRMED');

-- AlterEnum
ALTER TYPE "DocumentKind" ADD VALUE 'BILL_OF_SALE';

-- AlterTable
ALTER TABLE "orders" ADD COLUMN     "buyerCode" TEXT,
ADD COLUMN     "color" TEXT,
ADD COLUMN     "consignee" TEXT,
ADD COLUMN     "consolidate" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "deliveryBranch" TEXT,
ADD COLUMN     "exporter" TEXT,
ADD COLUMN     "finalDestination" TEXT,
ADD COLUMN     "gatePassId" TEXT,
ADD COLUMN     "hasKeys" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "inspectionStatus" "InspectionStatus" NOT NULL DEFAULT 'PENDING',
ADD COLUMN     "insured" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "oceanCargoType" TEXT,
ADD COLUMN     "paidDate" TIMESTAMP(3),
ADD COLUMN     "purchaseDate" TIMESTAMP(3),
ADD COLUMN     "receivingAgent" TEXT,
ADD COLUMN     "saleOrigin" TEXT,
ADD COLUMN     "seller" TEXT,
ADD COLUMN     "shippingLine" TEXT,
ADD COLUMN     "truckingRequired" BOOLEAN NOT NULL DEFAULT false;
