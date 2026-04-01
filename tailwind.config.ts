import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        "brand-dark": "#001910",
        "brand-green": "#00DB33",
        "brand-gray": "#F2F2F2",
        "brand-white": "#FFFFFF",
      },
      borderRadius: {
        'sm': '2px',
        'md': '4px',
      },
      boxShadow: {
        'none': 'none',
      },
    },
  },
  plugins: [],
};
export default config;
