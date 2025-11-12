/*
  Warnings:

  - Made the column `updatedAt` on table `subscribers` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "consultations" ADD COLUMN     "bookingCode" TEXT,
ADD COLUMN     "referer" TEXT,
ADD COLUMN     "sourceIp" TEXT,
ADD COLUMN     "userAgent" TEXT;

-- AlterTable
ALTER TABLE "subscribers" ALTER COLUMN "updatedAt" SET NOT NULL;

-- CreateIndex
CREATE INDEX "consultations_email_createdAt_idx" ON "consultations"("email", "createdAt");

-- CreateIndex
CREATE INDEX "consultations_status_idx" ON "consultations"("status");
