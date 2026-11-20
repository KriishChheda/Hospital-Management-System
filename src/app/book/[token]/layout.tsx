import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Patient Appointment Pre-Booking",
  description: "Digital appointment intake portal. Schedule your clinic consultation slot and complete check-in requirements.",
  robots: {
    index: true,
    follow: true,
  },
};

export default function BookLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
