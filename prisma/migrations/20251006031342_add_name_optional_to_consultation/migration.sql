/*
  Warnings:

  - The values [IN_PROGRESS,CLOSED] on the enum `ConsultationStatus` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `respondedAt` on the `consultations` table. All the data in the column will be lost.
  - You are about to drop the column `response` on the `consultations` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `consultations` table. All the data in the column will be lost.
  - You are about to alter the column `bookingCode` on the `consultations` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(32)`.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "ConsultationStatus_new" AS ENUM ('PENDING', 'IN_REVIEW', 'RESOLVED', 'ARCHIVED');
ALTER TABLE "public"."consultations" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "consultations" ALTER COLUMN "status" TYPE "ConsultationStatus_new" USING ("status"::text::"ConsultationStatus_new");
ALTER TYPE "ConsultationStatus" RENAME TO "ConsultationStatus_old";
ALTER TYPE "ConsultationStatus_new" RENAME TO "ConsultationStatus";
DROP TYPE "public"."ConsultationStatus_old";
ALTER TABLE "consultations" ALTER COLUMN "status" SET DEFAULT 'PENDING';
COMMIT;

-- AlterTable
ALTER TABLE "consultations" DROP COLUMN "respondedAt",
DROP COLUMN "response",
DROP COLUMN "updatedAt",
ADD COLUMN     "name" TEXT,
ALTER COLUMN "bookingCode" SET DATA TYPE VARCHAR(32);
