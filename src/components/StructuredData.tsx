import React from "react";

export default function StructuredData() {
  const schema = {
    "@context": "https://schema.org",
    "@type": "MedicalOrganization",
    "name": "BizLume Hospital Management System",
    "alternateName": "City General Hospital",
    "url": process.env.NEXT_PUBLIC_APP_URL || "https://bizlume-hms.vercel.app",
    "logo": `${process.env.NEXT_PUBLIC_APP_URL || "https://bizlume-hms.vercel.app"}/favicon.ico`,
    "description": "Enterprise healthcare management system delivering real-time OPD queue optimization, EMR consultation workflows, diagnostic pathology tracking, and automated pharmacy dispensing.",
    "medicalSpecialty": [
      "Cardiology",
      "GeneralPractice",
      "Pediatrics",
      "Orthopedics",
      "Radiology",
      "Pathology",
    ],
    "availableService": [
      {
        "@type": "MedicalProcedure",
        "name": "Doctor Outpatient Consultation",
      },
      {
        "@type": "MedicalTest",
        "name": "Pathology Diagnostics & Laboratory Orders",
      },
      {
        "@type": "MedicalProcedure",
        "name": "Pharmacy Medicine Dispensing",
      },
      {
        "@type": "MedicalProcedure",
        "name": "Digital Appointment Pre-Booking",
      },
    ],
    "contactPoint": {
      "@type": "ContactPoint",
      "telephone": "+91-98201-10001",
      "contactType": "Hospital Reception Desk",
      "areaServed": "IN",
      "availableLanguage": ["English", "Hindi"],
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
