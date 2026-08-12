import type { Config } from "tailwindcss";
const config: Config = { content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"], theme: { extend: { colors: { ink: "#102820", forest: "#154E3C", mint: "#DDF6E8", lime: "#B7EA54", canvas: "#F7F8F5" }, boxShadow: { premium: "0 20px 50px -20px rgba(16,40,32,.22)" } } }, plugins: [] };
export default config;
