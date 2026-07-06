import { NextResponse } from "next/server";
import prisma from "@/lib/db";

export async function POST(request: Request) {
    try {
        const body = await request.json();

        const {
            // Personal
            name, age, gender, dateOfBirth, bloodGroup, maritalStatus, nationality,
            // Contact
            phone, alternatePhone, email,
            // Address
            addressLine1, addressLine2, city, state, pincode, country,
            // Emergency
            emergencyContactName, emergencyContactRelationship, emergencyContactPhone,
            // Identification
            aadhaarNumber, aadhaarDocUrl,
            // Medical
            allergies, existingConditions, currentMedications, pastSurgeries, disabilityInfo,
            // Critical Level
            critical,
            // Consent
            detailsAccurate, privacyAccepted,
        } = body;

        // 1. Server-side validation for required fields
        if (!name || !gender || !phone || !dateOfBirth) {
            return NextResponse.json(
                { error: "Missing required fields: name, gender, phone, and date of birth are mandatory." },
                { status: 400 }
            );
        }

        if (!detailsAccurate || !privacyAccepted) {
            return NextResponse.json(
                { error: "You must confirm details accuracy and accept the privacy policy." },
                { status: 400 }
            );
        }

        // 2. Phone validation
        const phoneRegex = /^[0-9]{10}$/;
        if (!phoneRegex.test(phone)) {
            return NextResponse.json(
                { error: "Phone number must be exactly 10 digits." },
                { status: 400 }
            );
        }

        // 3. Aadhaar validation (if provided)
        if (aadhaarNumber && !/^[0-9]{12}$/.test(aadhaarNumber)) {
            return NextResponse.json(
                { error: "Aadhaar number must be exactly 12 digits." },
                { status: 400 }
            );
        }

        // 4. Create the patient in the database
        const newPatient = await prisma.patient.create({
            data: {
                name,
                age: parseInt(age) || 0,
                gender,
                dateOfBirth,
                bloodGroup: bloodGroup || null,
                maritalStatus: maritalStatus || null,
                nationality: nationality || "Indian",

                phone,
                alternatePhone: alternatePhone || null,
                email: email || null,

                addressLine1: addressLine1 || null,
                addressLine2: addressLine2 || null,
                city: city || null,
                state: state || null,
                pincode: pincode || null,
                country: country || "India",

                emergencyContactName: emergencyContactName || null,
                emergencyContactRelationship: emergencyContactRelationship || null,
                emergencyContactPhone: emergencyContactPhone || null,

                aadhaarNumber: aadhaarNumber || null,
                aadhaarDocUrl: aadhaarDocUrl || null,

                allergies: allergies || null,
                existingConditions: existingConditions || [],
                currentMedications: currentMedications || null,
                pastSurgeries: pastSurgeries || null,
                disabilityInfo: disabilityInfo || null,

                critical: critical || "low",

                detailsAccurate: Boolean(detailsAccurate),
                privacyAccepted: Boolean(privacyAccepted),
            },
        });

        // 5. Return the created patient
        return NextResponse.json(newPatient, { status: 201 });

    } catch (error: any) {
        console.error("Registration Error:", error);

        // Handle Unique Constraint Error (P2002 is Prisma's code for unique violation)
        if (error.code === 'P2002') {
            const target = error.meta?.target;
            if (target?.includes('phone')) {
                return NextResponse.json(
                    { error: "A patient with this phone number is already registered." },
                    { status: 400 }
                );
            }
            if (target?.includes('aadhaarNumber')) {
                return NextResponse.json(
                    { error: "A patient with this Aadhaar number is already registered." },
                    { status: 400 }
                );
            }
            return NextResponse.json(
                { error: "A patient with these details already exists." },
                { status: 400 }
            );
        }

        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}