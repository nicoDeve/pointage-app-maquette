import nextCoreWebVitals from "eslint-config-next/core-web-vitals"

/** @type {import("eslint").Linter.Config[]} */
const eslintConfig = [
  {
    ignores: ["node_modules/**", ".next/**", "out/**", "*.tsbuildinfo"],
  },
  ...nextCoreWebVitals,
  {
    rules: {
      // Règles expérimentales trop strictes pour ce dépôt (effets de synchro UI légitimes)
      "react-hooks/set-state-in-effect": "off",
      "react-hooks/immutability": "warn",
      "react-hooks/exhaustive-deps": "warn",
    },
  },
]

export default eslintConfig
