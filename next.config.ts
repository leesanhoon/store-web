import type { NextConfig } from "next";

function getApiImagePattern() {
  const rawUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? process.env.NEXT_PUBLIC_API_URL;
  if (!rawUrl) return null;

  try {
    const url = new URL(rawUrl);
    return {
      protocol: url.protocol.replace(":", "") as "http" | "https",
      hostname: url.hostname,
      port: url.port,
      pathname: "/**",
    };
  } catch {
    return null;
  }
}

const apiImagePattern = getApiImagePattern();

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      ...(apiImagePattern ? [apiImagePattern] : []),
      {
        protocol: "http",
        hostname: "localhost",
        port: "5289",
        pathname: "/**",
      },
      {
        protocol: "http",
        hostname: "127.0.0.1",
        port: "5289",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
