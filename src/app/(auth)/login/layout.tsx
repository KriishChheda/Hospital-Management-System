import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Staff Sign In",
  description: "Secure authentication portal for hospital staff, physicians, nurses, receptionists, and administrators.",
  alternates: {
    canonical: "/login",
  },
};

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
