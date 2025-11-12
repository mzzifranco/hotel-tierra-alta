/*
  Warnings:

  - The values [PAID,FAILED] on the enum `ServicePaymentStatus` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "ServicePaymentStatus_new" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'REFUNDED');
ALTER TABLE "public"."service_payments" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "service_payments" ALTER COLUMN "status" TYPE "ServicePaymentStatus_new" USING ("status"::text::"ServicePaymentStatus_new");
ALTER TYPE "ServicePaymentStatus" RENAME TO "ServicePaymentStatus_old";
ALTER TYPE "ServicePaymentStatus_new" RENAME TO "ServicePaymentStatus";
DROP TYPE "public"."ServicePaymentStatus_old";
ALTER TABLE "service_payments" ALTER COLUMN "status" SET DEFAULT 'PENDING';
COMMIT;
