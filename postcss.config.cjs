// postcss.config.cjs (root)
module.exports = {
  plugins: {
    tailwindcss: { config: './client/tailwind.config.ts' },
    autoprefixer: {},
  },
};
