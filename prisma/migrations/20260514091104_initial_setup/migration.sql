-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'DOCTOR', 'NURSE', 'RECEPTIONIST', 'PHARMACIST');

-- CreateTable
CREATE TABLE "Patient" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "name" TEXT NOT NULL,
    "age" INTEGER NOT NULL,
    "gender" TEXT NOT NULL,
    "dateOfBirth" TEXT NOT NULL DEFAULT '',
    "bloodGroup" TEXT,
    "maritalStatus" TEXT,
    "nationality" TEXT NOT NULL DEFAULT 'Indian',
    "phone" TEXT NOT NULL,
    "alternatePhone" TEXT,
    "email" TEXT,
    "addressLine1" TEXT,
    "addressLine2" TEXT,
    "city" TEXT,
    "state" TEXT,
    "pincode" TEXT,
    "country" TEXT NOT NULL DEFAULT 'India',
    "emergencyContactName" TEXT,
    "emergencyContactRelationship" TEXT,
    "emergencyContactPhone" TEXT,
    "aadhaarNumber" TEXT,
    "aadhaarDocUrl" TEXT,
    "allergies" TEXT,
    "existingConditions" TEXT[],
    "currentMedications" TEXT,
    "pastSurgeries" TEXT,
    "disabilityInfo" TEXT,
    "detailsAccurate" BOOLEAN NOT NULL DEFAULT false,
    "privacyAccepted" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Patient_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" "Role" NOT NULL,
    "status" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Patient_phone_key" ON "Patient"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "Patient_aadhaarNumber_key" ON "Patient"("aadhaarNumber");

-- CreateIndex
CREATE UNIQUE INDEX "User_employeeId_key" ON "User"("employeeId");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
