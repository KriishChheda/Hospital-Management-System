import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "BizLume Hospital Management System",
    short_name: "BizLume HMS",
    description: "AI-Powered Outpatient Management, EMR Consultations, and Clinic Queue Optimization",
    start_url: "/",
    display: "standalone",
    background_color: "#FFFFFF",
    theme_color: "#0E1A2B",
    icons: [
      {
        src: "/favicon.ico",
        sizes: "any",
        type: "image/x-icon",
      },
    ],
  };
}
