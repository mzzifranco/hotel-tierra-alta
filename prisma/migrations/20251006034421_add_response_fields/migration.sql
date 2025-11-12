/*
  Warnings:

  - You are about to drop the column `updatedAt` on the `consultations` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "consultations" DROP COLUMN "updatedAt",
ADD COLUMN     "respondedAt" TIMESTAMP(3),
ADD COLUMN     "response" TEXT;
