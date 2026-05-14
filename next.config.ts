import type { NextConfig } from "next";

function getApiOrigin() {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  if (!apiUrl) return "http://localhost:3001";

  try {
    return new URL(apiUrl).origin;
  } catch {
    return "";
  }
}

const nextConfig: NextConfig = {
  async headers() {
    const isDevelopment = process.env.NODE_ENV !== "production";
    const connectSrc = ["'self'", getApiOrigin()].filter(Boolean);

    if (isDevelopment) {
      connectSrc.push("http://localhost:*", "ws://localhost:*");
    }

    const contentSecurityPolicy = [
      "default-src 'self'",
      "base-uri 'self'",
      `connect-src ${connectSrc.join(" ")}`,
      "font-src 'self' data:",
      "form-action 'self'",
      "frame-ancestors 'none'",
      "img-src 'self' data: blob: https:",
      "object-src 'none'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      "style-src 'self' 'unsafe-inline'",
    ].join("; ");

    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "Content-Security-Policy",
            value: contentSecurityPolicy,
          },
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
