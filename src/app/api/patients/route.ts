import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { requireAuth } from "@/lib/authGuard";

// Robust sequential patient code generator: guarantees no collisions across any existing records
async function generatePatientCode(tx?: any): Promise<string> {
    const client = tx || prisma;
    const allPatients = await client.patient.findMany({
        select: { patientCode: true },
    });

    let maxNum = 0;
    const takenCodes = new Set<string>();

    for (const p of allPatients) {
        if (p.patientCode) {
            takenCodes.add(p.patientCode);
            const match = p.patientCode.match(/(\d+)/);
            if (match) {
                const n = parseInt(match[1], 10);
                if (!isNaN(n) && n > maxNum) {
                    maxNum = n;
                }
            }
        }
    }

    let nextNum = maxNum + 1;
    while (true) {
        const candidate = `HMS-${String(nextNum).padStart(4, "0")}`;
        if (!takenCodes.has(candidate)) {
            return candidate;
        }
        nextNum++;
    }
}

export async function POST(request: Request) {
    const auth = await requireAuth(request, ["RECEPTIONIST", "ADMIN"]);
    if (!auth.success) return auth.response;

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
            // Doctor assignment (queue system)
            doctorProfileId,
            scheduledTime,
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

            // Create a new visit with doctor assignment
            const visit = await prisma.visit.create({
                data: {
                    patientId: existingPatientId,
                    critical: critical || "low",
                    doctorProfileId: doctorProfileId || null,
                    scheduledTime: scheduledTime ? new Date(scheduledTime) : null,
                },
            });

            // Auto-enqueue if a doctor was assigned
            if (doctorProfileId) {
                await prisma.queueEntry.create({
                    data: {
                        visitId: visit.id,
                        doctorProfileId,
                        checkInTime: new Date(),
                        status: "WAITING",
                    },
                });
            }

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

        // 2. Phone validation and duplicate pre-check
        const phoneRegex = /^[0-9]{10}$/;
        if (!phoneRegex.test(phone)) {
            return NextResponse.json(
                { error: "Phone number must be exactly 10 digits." },
                { status: 400 }
            );
        }

        const existingPhone = await prisma.patient.findUnique({
            where: { phone },
            select: { id: true, name: true, patientCode: true },
        });
        if (existingPhone) {
            return NextResponse.json(
                { 
                    error: `A patient with phone number ${phone} is already registered (${existingPhone.name}, ${existingPhone.patientCode}). If this is a repeat visit, please search them under 'Returning Patient' to register a new visit.` 
                },
                { status: 400 }
            );
        }

        // 3. Aadhaar validation and duplicate pre-check (if provided)
        const cleanAadhaar = aadhaarNumber && String(aadhaarNumber).trim().length > 0 ? String(aadhaarNumber).trim() : null;
        if (cleanAadhaar) {
            if (!/^[0-9]{12}$/.test(cleanAadhaar)) {
                return NextResponse.json(
                    { error: "Aadhaar number must be exactly 12 digits." },
                    { status: 400 }
                );
            }

            const existingAadhaar = await prisma.patient.findUnique({
                where: { aadhaarNumber: cleanAadhaar },
                select: { id: true, name: true, patientCode: true },
            });
            if (existingAadhaar) {
                return NextResponse.json(
                    { 
                        error: `A patient with this Aadhaar number is already registered (${existingAadhaar.name}, ${existingAadhaar.patientCode}).` 
                    },
                    { status: 400 }
                );
            }
        }

        // 4. Generate a sequential, collision-free human-readable patient code
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

                    aadhaarNumber: cleanAadhaar,
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
                    doctorProfileId: doctorProfileId || null,
                    scheduledTime: scheduledTime ? new Date(scheduledTime) : null,
                },
            });

            // Auto-enqueue if a doctor was assigned
            if (doctorProfileId) {
                await tx.queueEntry.create({
                    data: {
                        visitId: visit.id,
                        doctorProfileId,
                        checkInTime: new Date(),
                        status: "WAITING",
                    },
                });
            }

            return { ...newPatient, visit };
        });

        // 6. Return the created patient with visit
        return NextResponse.json(result, { status: 201 });

    } catch (error: any) {
        console.error("Registration Error:", error);

        // Handle Unique Constraint Error (P2002 is Prisma's code for unique violation)
        if (error.code === 'P2002') {
            const target = error.meta?.target;
            const targetStr = Array.isArray(target)
                ? target.join(' ').toLowerCase()
                : String(target || '').toLowerCase();

            if (targetStr.includes('phone')) {
                return NextResponse.json(
                    { error: "A patient with this mobile number is already registered. If they have visited before, please search under Returning Patient." },
                    { status: 400 }
                );
            }
            if (targetStr.includes('aadhaar')) {
                return NextResponse.json(
                    { error: "A patient with this Aadhaar number is already registered. Please verify the Aadhaar number." },
                    { status: 400 }
                );
            }
            if (targetStr.includes('patientcode') || targetStr.includes('patient_patientcode_key')) {
                return NextResponse.json(
                    { error: "Patient ID collision occurred. Please submit again to generate the next ID." },
                    { status: 400 }
                );
            }
            return NextResponse.json(
                { error: `A patient with these details already exists (${targetStr || 'Duplicate unique record'}).` },
                { status: 400 }
            );
        }

        return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
    }
}