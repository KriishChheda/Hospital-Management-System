-- CreateEnum
CREATE TYPE "LabOrderStatus" AS ENUM ('PENDING', 'COMPLETED', 'CANCELLED');

-- CreateTable
CREATE TABLE "EMRVisit" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "patientId" TEXT NOT NULL,
    "doctorId" TEXT NOT NULL,
    "doctorName" TEXT NOT NULL,
    "bloodPressure" TEXT,
    "temperature" TEXT,
    "heartRate" TEXT,
    "respiratoryRate" TEXT,
    "weight" TEXT,
    "chiefComplaint" TEXT NOT NULL,
    "clinicalNotes" TEXT NOT NULL,
    "diagnosis" TEXT,
    "aiSuggestions" TEXT,
    "customHeader" TEXT DEFAULT 'CITY GENERAL HOSPITAL - OUTPATIENT DEPARTMENT',
    "customFooter" TEXT DEFAULT 'Please bring this prescription note on your next visit.',

    CONSTRAINT "EMRVisit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LabOrder" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "patientId" TEXT NOT NULL,
    "doctorId" TEXT NOT NULL,
    "doctorName" TEXT NOT NULL,
    "testName" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "status" "LabOrderStatus" NOT NULL DEFAULT 'PENDING',
    "resultNotes" TEXT,
    "flaggedAlert" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "LabOrder_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "EMRVisit" ADD CONSTRAINT "EMRVisit_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LabOrder" ADD CONSTRAINT "LabOrder_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
