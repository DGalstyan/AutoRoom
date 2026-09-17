-- CreateEnum
CREATE TYPE "AuctionPlatform" AS ENUM ('COPART', 'IAAI', 'MANHEIM');

-- AlterTable
ALTER TABLE "cars" ADD COLUMN     "auctionPlatform" "AuctionPlatform";
