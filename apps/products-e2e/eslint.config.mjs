import { FlatCompat } from "@eslint/eslintrc";
import { dirname } from "path";
import { fileURLToPath } from "url";
import js from "@eslint/js";
import baseConfig from "../../eslint.config.mjs";

const compat = new FlatCompat({
  baseDirectory: dirname(fileURLToPath(import.meta.url)),
  recommendedConfig: js.configs.recommended,
});


export default [
    ...baseConfig,
    ...compat.extends("plugin:cypress/recommended"),
    {
        files: [
            "**/*.ts",
            "**/*.tsx",
            "**/*.js",
            "**/*.jsx"
        ],
        // Override or add rules here
        rules: {},
        languageOptions: {
            parserOptions: {
                project: "apps/products-e2e/tsconfig.*?.json"
            }
        }
    },
    {
        files: [
            "src/plugins/index.js"
        ],
        rules: {
            "@typescript-eslint/no-var-requires": "off",
            "no-undef": "off"
        }
    },
    {
        ignores: [
            "out-tsc",
            "src/test-setup.ts"
        ]
    }
];
