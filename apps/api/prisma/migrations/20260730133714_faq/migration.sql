-- CreateEnum
CREATE TYPE "FaqTopic" AS ENUM ('CHINA', 'USA', 'GENERAL');

-- CreateTable
CREATE TABLE "faq" (
    "id" TEXT NOT NULL,
    "topic" "FaqTopic" NOT NULL,
    "question" TEXT NOT NULL,
    "answer" TEXT,
    "position" INTEGER NOT NULL DEFAULT 0,
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "faq_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "faq_topic_position_idx" ON "faq"("topic", "position");
