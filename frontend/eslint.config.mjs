import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    rules: {
      "@typescript-eslint/no-unused-vars": "off", // disables unused vars
      "@typescript-eslint/no-explicit-any": "off", // disables 'any' type warning
      "react/no-unescaped-entities": "off", // disables quote escaping in JSX
      "react-hooks/exhaustive-deps": "warn", // only warn on useEffect deps
    },
  },
];

export default eslintConfig;
