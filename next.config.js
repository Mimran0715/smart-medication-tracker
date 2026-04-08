
// next.config.js
console.log("NEXT CONFIG LOADING");
/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ['pg'],
};

module.exports = nextConfig;