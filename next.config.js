/** @type {import('next').NextConfig} */
const nextConfig = {
  async redirects() {
    return [
      {
        source: '/:path*',
        has: [
          { type: 'host', value: 'www.mylinked.app' },
        ],
        destination: 'https://mylinked.app/:path*',
        permanent: true,
      },
    ];
  },
};

module.exports = nextConfig;
