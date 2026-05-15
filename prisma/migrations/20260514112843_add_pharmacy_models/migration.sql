-- CreateEnum
CREATE TYPE "PrescriptionStatus" AS ENUM ('PENDING', 'DISPENSED', 'CANCELLED', 'PARTIAL');

-- CreateTable
CREATE TABLE "Medicine" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "name" TEXT NOT NULL,
    "genericName" TEXT,
    "category" TEXT NOT NULL,
    "manufacturer" TEXT,
    "batchNumber" TEXT,
    "barcode" TEXT,
    "currentStock" INTEGER NOT NULL DEFAULT 0,
    "minStockLevel" INTEGER NOT NULL DEFAULT 10,
    "unit" TEXT NOT NULL DEFAULT 'tablets',
    "pricePerUnit" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "expiryDate" TIMESTAMP(3),
    "manufactureDate" TIMESTAMP(3),

    CONSTRAINT "Medicine_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Prescription" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "patientId" TEXT NOT NULL,
    "doctorId" TEXT,
    "doctorName" TEXT,
    "visitId" TEXT,
    "notes" TEXT,
    "status" "PrescriptionStatus" NOT NULL DEFAULT 'PENDING',

    CONSTRAINT "Prescription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PrescriptionItem" (
    "id" TEXT NOT NULL,
    "prescriptionId" TEXT NOT NULL,
    "medicineId" TEXT NOT NULL,
    "dosage" TEXT NOT NULL,
    "frequency" TEXT NOT NULL,
    "duration" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "dispensed" INTEGER NOT NULL DEFAULT 0,
    "instructions" TEXT,

    CONSTRAINT "PrescriptionItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PharmacistLog" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "pharmacistId" TEXT NOT NULL,
    "pharmacistName" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "details" TEXT,
    "prescriptionId" TEXT,
    "medicineId" TEXT,

    CONSTRAINT "PharmacistLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PharmacyBilling" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "prescriptionId" TEXT NOT NULL,
    "totalAmount" DOUBLE PRECISION NOT NULL,
    "paid" BOOLEAN NOT NULL DEFAULT false,
    "paymentMethod" TEXT,

    CONSTRAINT "PharmacyBilling_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Medicine_barcode_key" ON "Medicine"("barcode");

-- CreateIndex
CREATE UNIQUE INDEX "PharmacyBilling_prescriptionId_key" ON "PharmacyBilling"("prescriptionId");

-- AddForeignKey
ALTER TABLE "Prescription" ADD CONSTRAINT "Prescription_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PrescriptionItem" ADD CONSTRAINT "PrescriptionItem_prescriptionId_fkey" FOREIGN KEY ("prescriptionId") REFERENCES "Prescription"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PrescriptionItem" ADD CONSTRAINT "PrescriptionItem_medicineId_fkey" FOREIGN KEY ("medicineId") REFERENCES "Medicine"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PharmacistLog" ADD CONSTRAINT "PharmacistLog_prescriptionId_fkey" FOREIGN KEY ("prescriptionId") REFERENCES "Prescription"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PharmacistLog" ADD CONSTRAINT "PharmacistLog_medicineId_fkey" FOREIGN KEY ("medicineId") REFERENCES "Medicine"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PharmacyBilling" ADD CONSTRAINT "PharmacyBilling_prescriptionId_fkey" FOREIGN KEY ("prescriptionId") REFERENCES "Prescription"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
