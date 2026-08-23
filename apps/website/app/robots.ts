import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/nexora-ai/dashboard",
        "/nexora-ai/chat",
        "/nexora-ai/conversations",
        "/nexora-ai/documents",
        "/nexora-ai/knowledge",
      ],
    },
    sitemap: "https://nexora-tech.pt/sitemap.xml",
  };
}

