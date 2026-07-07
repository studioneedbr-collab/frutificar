-- CreateEnum
CREATE TYPE "AnalysisStatus" AS ENUM ('PENDING', 'COMPLETED');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PAID', 'PENDING', 'FAILED', 'REFUNDED');

-- AlterTable
ALTER TABLE "Plan" ADD COLUMN     "active" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "Plot" ADD COLUMN     "cropName" TEXT;

-- AlterTable
ALTER TABLE "Property" ADD COLUMN     "altitudeM" INTEGER,
ADD COLUMN     "cropName" TEXT;

-- AlterTable
ALTER TABLE "SoilAnalysis" ADD COLUMN     "analysisType" TEXT NOT NULL DEFAULT 'Completa',
ADD COLUMN     "status" "AnalysisStatus" NOT NULL DEFAULT 'COMPLETED',
ADD COLUMN     "summary" TEXT;

-- AlterTable
ALTER TABLE "TechnicalVisit" ADD COLUMN     "agronomist" TEXT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "suspendedAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "Payment" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "subscriptionId" TEXT,
    "amount" DECIMAL(10,2) NOT NULL,
    "status" "PaymentStatus" NOT NULL DEFAULT 'PAID',
    "method" TEXT NOT NULL DEFAULT 'Cartão de crédito',
    "description" TEXT,
    "paidAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "Subscription"("id") ON DELETE SET NULL ON UPDATE CASCADE;

