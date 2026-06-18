import { FlatCompat } from "@eslint/eslintrc";
import { dirname } from "path";
import { fileURLToPath } from "url";
import js from "@eslint/js";
import baseConfig from "../../eslint.config.mjs";
import nx from "@nx/eslint-plugin";

const compat = new FlatCompat({
  baseDirectory: dirname(fileURLToPath(import.meta.url)),
  recommendedConfig: js.configs.recommended,
});


export default [
    ...baseConfig,
    ...nx.configs["flat/angular"],
    ...compat.config({
        plugins: [
            "@typescript-eslint"
        ]
    }).map(config => ({
        ...config,
        files: [
            "**/*.ts"
        ],
        rules: {
            ...config.rules,
            "@angular-eslint/directive-selector": [
                "error",
                {
                    type: "attribute",
                    prefix: "nxExample",
                    style: "camelCase"
                }
            ],
            "@angular-eslint/component-selector": [
                "error",
                {
                    type: "element",
                    prefix: "nx-example",
                    style: "kebab-case"
                }
            ],
            "@angular-eslint/prefer-standalone": "off"
        },
        languageOptions: {
            parserOptions: {
                project: [
                    "apps/products/tsconfig.*?.json"
                ]
            }
        }
    })),
    ...nx.configs["flat/angular-template"],
    {
        files: [
            "**/*.ts"
        ],
        rules: {
            "@angular-eslint/prefer-on-push-component-change-detection": "off"
        }
    },
    {
        files: [
            "**/*.html"
        ],
        rules: {
            "@angular-eslint/template/alt-text": "off"
        }
    },
    {
        ignores: [
            "out-tsc",
            "src/test-setup.ts"
        ]
    }
];
