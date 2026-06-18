import baseConfig from "../../eslint.config.mjs";
import pluginCypress from "eslint-plugin-cypress/flat";


export default [
    ...baseConfig,
    pluginCypress.configs.recommended,
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
                project: "apps/cart-e2e/tsconfig.*?.json"
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
