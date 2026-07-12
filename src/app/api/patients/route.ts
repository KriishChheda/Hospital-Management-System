import { NextResponse } from "next/server";
import prisma from "@/lib/db";

// Generate a human-readable patient code: HMS-0001, HMS-0002, etc.
async function generatePatientCode(): Promise<string> {
    const lastPatient = await prisma.patient.findFirst({
        orderBy: { patientCode: "desc" },
        select: { patientCode: true },
    });

    let nextNum = 1;
    if (lastPatient?.patientCode) {
        const match = lastPatient.patientCode.match(/HMS-(\d+)/);
        if (match) nextNum = parseInt(match[1]) + 1;
    }

    return `HMS-${String(nextNum).padStart(4, "0")}`;
}

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
            // Critical Level (per-visit)
            critical,
            // Consent
            detailsAccurate, privacyAccepted,
            // Returning patient flag
            existingPatientId,
        } = body;

        // ── RETURNING PATIENT: create a new visit for an existing patient ──
        if (existingPatientId) {
            const existingPatient = await prisma.patient.findUnique({
                where: { id: existingPatientId },
            });

            if (!existingPatient) {
                return NextResponse.json(
                    { error: "Patient not found with the provided ID." },
                    { status: 404 }
                );
            }

            // Check if patient already has an active ongoing visit
            const activeVisit = await prisma.visit.findFirst({
                where: {
                    patientId: existingPatientId,
                    paymentStatus: false,
                },
            });

            if (activeVisit) {
                return NextResponse.json(
                    { error: "This patient already has an ongoing visit. Please clear their pending bill before registering a new visit." },
                    { status: 400 }
                );
            }

            // Optionally update patient details if they changed (e.g., new phone)
            const updatedPatient = await prisma.patient.update({
                where: { id: existingPatientId },
                data: {
                    ...(phone && phone !== existingPatient.phone ? { phone } : {}),
                    ...(alternatePhone !== undefined ? { alternatePhone: alternatePhone || null } : {}),
                    ...(email !== undefined ? { email: email || null } : {}),
                    ...(addressLine1 !== undefined ? { addressLine1: addressLine1 || null } : {}),
                    ...(addressLine2 !== undefined ? { addressLine2: addressLine2 || null } : {}),
                    ...(city !== undefined ? { city: city || null } : {}),
                    ...(state !== undefined ? { state: state || null } : {}),
                    ...(pincode !== undefined ? { pincode: pincode || null } : {}),
                    ...(emergencyContactName !== undefined ? { emergencyContactName: emergencyContactName || null } : {}),
                    ...(emergencyContactRelationship !== undefined ? { emergencyContactRelationship: emergencyContactRelationship || null } : {}),
                    ...(emergencyContactPhone !== undefined ? { emergencyContactPhone: emergencyContactPhone || null } : {}),
                    // Update medical history if provided
                    ...(allergies !== undefined ? { allergies: allergies || null } : {}),
                    ...(existingConditions !== undefined ? { existingConditions: existingConditions || [] } : {}),
                    ...(currentMedications !== undefined ? { currentMedications: currentMedications || null } : {}),
                },
            });

            // Create a new visit
            const visit = await prisma.visit.create({
                data: {
                    patientId: existingPatientId,
                    critical: critical || "low",
                },
            });

            return NextResponse.json({
                ...updatedPatient,
                visit,
                isReturning: true,
            }, { status: 201 });
        }

        // ── NEW PATIENT REGISTRATION ──

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

        // 4. Generate a human-readable patient code
        const patientCode = await generatePatientCode();

        // 5. Create the patient + first visit in a transaction
        const result = await prisma.$transaction(async (tx: any) => {
            const newPatient = await tx.patient.create({
                data: {
                    patientCode,
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

                    detailsAccurate: Boolean(detailsAccurate),
                    privacyAccepted: Boolean(privacyAccepted),
                },
            });

            const visit = await tx.visit.create({
                data: {
                    patientId: newPatient.id,
                    critical: critical || "low",
                },
            });

            return { ...newPatient, visit };
        });

        // 6. Return the created patient with visit
        return NextResponse.json(result, { status: 201 });

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