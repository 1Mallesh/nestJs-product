-- AlterEnum
ALTER TYPE "ApprovalStatus" ADD VALUE 'DRAFT';

-- AlterTable
ALTER TABLE "products" ADD COLUMN     "approvedAt" TIMESTAMP(3),
ADD COLUMN     "approvedBy" TEXT,
ADD COLUMN     "isPublished" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "publishedAt" TIMESTAMP(3);
