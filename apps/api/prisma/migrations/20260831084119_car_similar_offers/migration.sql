-- CreateTable
CREATE TABLE "car_similar" (
    "carId" TEXT NOT NULL,
    "similarCarId" TEXT NOT NULL,
    "position" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "car_similar_pkey" PRIMARY KEY ("carId","similarCarId")
);

-- CreateIndex
CREATE INDEX "car_similar_similarCarId_idx" ON "car_similar"("similarCarId");

-- AddForeignKey
ALTER TABLE "car_similar" ADD CONSTRAINT "car_similar_carId_fkey" FOREIGN KEY ("carId") REFERENCES "cars"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "car_similar" ADD CONSTRAINT "car_similar_similarCarId_fkey" FOREIGN KEY ("similarCarId") REFERENCES "cars"("id") ON DELETE CASCADE ON UPDATE CASCADE;
