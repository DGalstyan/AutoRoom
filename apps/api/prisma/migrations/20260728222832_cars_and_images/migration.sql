-- CreateEnum
CREATE TYPE "CarOrigin" AS ENUM ('CHINA', 'USA');

-- CreateEnum
CREATE TYPE "CarCondition" AS ENUM ('IN_STOCK', 'ON_ORDER', 'ON_ROAD', 'AUCTION');

-- CreateEnum
CREATE TYPE "CarStatusBadge" AS ENUM ('NA_NAVUM', 'POTI', 'CUSTOMS');

-- CreateEnum
CREATE TYPE "Powertrain" AS ENUM ('EV', 'HYBRID', 'BENZIN');

-- CreateEnum
CREATE TYPE "ImageAlbum" AS ENUM ('EXTERIOR', 'INTERIOR', 'DETAILS', 'VIDEO', 'AUCTION', 'RECEIPT', 'HANDOVER');

-- CreateTable
CREATE TABLE "cars" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "origin" "CarOrigin" NOT NULL,
    "make" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "trim" TEXT,
    "powertrain" "Powertrain" NOT NULL,
    "range" INTEGER,
    "battery" TEXT,
    "engine" TEXT,
    "drivetrain" TEXT,
    "transmission" TEXT,
    "seats" INTEGER,
    "warranty" TEXT,
    "vin" TEXT,
    "lotNumber" TEXT,
    "mileage" INTEGER,
    "price" INTEGER NOT NULL,
    "oldPrice" INTEGER,
    "estFinalPriceAM" INTEGER,
    "condition" "CarCondition" NOT NULL,
    "statusBadge" "CarStatusBadge",
    "deliveryEtaDays" INTEGER,
    "location" TEXT,
    "damageHistory" TEXT,
    "financingAvailable" BOOLEAN NOT NULL DEFAULT true,
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "colors" JSONB NOT NULL DEFAULT '[]',
    "priceJourney" JSONB NOT NULL DEFAULT '[]',
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cars_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "car_images" (
    "id" TEXT NOT NULL,
    "carId" TEXT NOT NULL,
    "album" "ImageAlbum" NOT NULL,
    "url" TEXT NOT NULL,
    "position" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "car_images_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "cars_slug_key" ON "cars"("slug");

-- CreateIndex
CREATE INDEX "cars_origin_condition_idx" ON "cars"("origin", "condition");

-- CreateIndex
CREATE INDEX "cars_featured_idx" ON "cars"("featured");

-- CreateIndex
CREATE INDEX "cars_publishedAt_idx" ON "cars"("publishedAt");

-- CreateIndex
CREATE INDEX "car_images_carId_album_idx" ON "car_images"("carId", "album");

-- AddForeignKey
ALTER TABLE "car_images" ADD CONSTRAINT "car_images_carId_fkey" FOREIGN KEY ("carId") REFERENCES "cars"("id") ON DELETE CASCADE ON UPDATE CASCADE;
