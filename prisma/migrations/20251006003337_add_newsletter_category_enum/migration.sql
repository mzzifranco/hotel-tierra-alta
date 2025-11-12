-- CreateEnum
CREATE TYPE "NewsletterCategory" AS ENUM ('PROMOCIONES', 'NOVEDADES', 'EVENTOS', 'TEMPORADA', 'CONSEJOS', 'GENERAL');

-- AlterTable
ALTER TABLE "newsletters" ADD COLUMN     "category" "NewsletterCategory" NOT NULL DEFAULT 'GENERAL';
