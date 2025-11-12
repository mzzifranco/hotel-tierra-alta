/*
  Warnings:

  - The values [SINGLE,DOUBLE,SUITE,DELUXE,PRESIDENTIAL] on the enum `RoomType` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "RoomType_new" AS ENUM ('SUITE_SINGLE', 'SUITE_DOUBLE', 'VILLA_PETIT', 'VILLA_GRANDE');
ALTER TABLE "rooms" ALTER COLUMN "type" TYPE "RoomType_new" USING ("type"::text::"RoomType_new");
ALTER TYPE "RoomType" RENAME TO "RoomType_old";
ALTER TYPE "RoomType_new" RENAME TO "RoomType";
DROP TYPE "public"."RoomType_old";
COMMIT;
