/* global process */
/** Where the Nest API is served; `/api/*` is proxied there. */
const API_URL =
  process.env.API_URL ??
  process.env.NEXT_PUBLIC_API_URL ??
  "http://localhost:3001";

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Proxying keeps the auth cookies first-party to the web app.
  rewrites: async () => [
    { source: "/api/:path*", destination: `${API_URL}/:path*` },
  ],
  // Only our own pages may frame the site, so it can't be clickjacked.
  // Embeds set their own list of sites, per embed, in proxy.ts.
  headers: async () => [
    {
      source: "/((?!embed/).*)",
      headers: [
        { key: "Content-Security-Policy", value: "frame-ancestors 'self'" },
        { key: "X-Frame-Options", value: "SAMEORIGIN" },
      ],
    },
  ],
};

export default nextConfig;
