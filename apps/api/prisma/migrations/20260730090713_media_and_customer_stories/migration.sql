-- CreateEnum
CREATE TYPE "MediaKind" AS ENUM ('FOUNDER', 'CUSTOMER_STORY', 'GUIDE_REEL');

-- CreateTable
CREATE TABLE "media" (
    "id" TEXT NOT NULL,
    "kind" "MediaKind" NOT NULL,
    "title" TEXT NOT NULL,
    "videoUrl" TEXT NOT NULL,
    "posterUrl" TEXT,
    "customerName" TEXT,
    "carLabel" TEXT,
    "origin" "CarOrigin",
    "whyChosen" TEXT,
    "experience" TEXT,
    "position" INTEGER NOT NULL DEFAULT 0,
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "media_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "media_kind_position_idx" ON "media"("kind", "position");
