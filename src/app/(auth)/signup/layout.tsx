import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Request Staff Access",
  description: "Request an employee portal account for hospital clinical, administrative, or diagnostic staff.",
  alternates: {
    canonical: "/signup",
  },
};

export default function SignupLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
