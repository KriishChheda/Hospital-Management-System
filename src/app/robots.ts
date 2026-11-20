import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://bizlume-hms.vercel.app";

  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/login", "/signup", "/book/"],
        disallow: [
          "/api/",
          "/admin-dashboard/",
          "/reports/",
          "/doctor-dashboard/",
          "/doctor-profile/",
          "/emr/",
          "/nurse-dashboard/",
          "/registeration/",
          "/appointments/",
          "/queue/",
          "/billing/",
          "/inventory/",
          "/lab-dashboard/",
          "/lab-inventory/",
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
