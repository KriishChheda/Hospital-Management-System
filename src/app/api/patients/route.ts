import { NextResponse } from "next/server";
import prisma from "@/lib/db";

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { name, age, gender, phone } = body;

        // 1. Basic Server-side validation
        if (!name || !gender || !phone) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        // 2. Create the patient in the database
        const newPatient = await prisma.patient.create({
            data: {
                name,
                age: parseInt(age) || 0,
                gender,
                phone,
            },
        });

        // 3. Return the created patient
        return NextResponse.json(newPatient, { status: 201 });

    } catch (error: any) {
        console.error("Registration Error:", error);

        // Handle Unique Constraint Error (P2002 is Prisma's code for unique violation)
        if (error.code === 'P2002') {
            return NextResponse.json(
                { error: "A patient with this phone number is already registered." },
                { status: 400 }
            );
        }

        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}