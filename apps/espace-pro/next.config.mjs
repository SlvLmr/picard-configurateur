/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Messages et Calendrier sont désormais sur l'accueil : les anciens liens y mènent
  async redirects() {
    return [
      { source: "/news", destination: "/accueil#messages", permanent: false },
      { source: "/calendrier", destination: "/accueil#agenda", permanent: false },
    ];
  },
};

export default nextConfig;
