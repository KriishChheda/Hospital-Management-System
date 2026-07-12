import { NextResponse } from "next/server";
import prisma from "@/lib/db";

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        // id is now a VISIT id — fetch the visit with full patient details + history
        const visit = await prisma.visit.findUnique({
            where: { id },
            include: {
                patient: {
                    include: {
                        // Include ALL past visits for this patient (for history view)
                        visits: {
                            orderBy: { createdAt: "desc" },
                            include: {
                                prescriptions: {
                                    orderBy: { createdAt: "desc" },
                                    take: 5,
                                },
                                emrVisits: {
                                    orderBy: { createdAt: "desc" },
                                    take: 5,
                                },
                                labOrders: {
                                    orderBy: { createdAt: "desc" },
                                    take: 10,
                                },
                            },
                        },
                    },
                },
                // Also include current visit's own relations
                prescriptions: {
                    orderBy: { createdAt: "desc" },
                    take: 5,
                },
                emrVisits: {
                    orderBy: { createdAt: "desc" },
                    take: 5,
                },
                labOrders: {
                    orderBy: { createdAt: "desc" },
                    take: 10,
                },
            },
        });

        if (!visit) {
            return NextResponse.json(
                { error: "Visit not found" },
                { status: 404 }
            );
        }

        // Flatten patient data for the EMR workstation while preserving visit context
        const patient = visit.patient;
        const response = {
            // Current visit info
            visitId: visit.id,
            critical: visit.critical,
            paymentStatus: visit.paymentStatus,

            // Patient identity
            patientId: patient.id,
            patientCode: patient.patientCode,
            name: patient.name,
            age: patient.age,
            gender: patient.gender,
            phone: patient.phone,
            bloodGroup: patient.bloodGroup,
            maritalStatus: patient.maritalStatus,
            email: patient.email,
            addressLine1: patient.addressLine1,
            addressLine2: patient.addressLine2,
            city: patient.city,
            state: patient.state,
            pincode: patient.pincode,

            // Medical history (permanent)
            allergies: patient.allergies,
            existingConditions: patient.existingConditions,
            currentMedications: patient.currentMedications,
            pastSurgeries: patient.pastSurgeries,
            disabilityInfo: patient.disabilityInfo,

            // Current visit's records
            prescriptions: visit.prescriptions,
            emrVisits: visit.emrVisits,
            labOrders: visit.labOrders,

            // Past visits history (all visits for this patient)
            pastVisits: patient.visits.filter(v => v.id !== visit.id).map(v => ({
                visitId: v.id,
                createdAt: v.createdAt,
                critical: v.critical,
                paymentStatus: v.paymentStatus,
                prescriptions: v.prescriptions,
                emrVisits: v.emrVisits,
                labOrders: v.labOrders,
            })),
        };

        return NextResponse.json(response, { status: 200 });
    } catch (error) {
        console.error("Patient fetch error:", error);
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    }
}
