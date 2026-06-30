import { FlatCompat } from "@eslint/eslintrc";
import { dirname } from "path";
import { fileURLToPath } from "url";
import js from "@eslint/js";
import baseConfig from "../../../eslint.config.mjs";
import nx from "@nx/eslint-plugin";

const compat = new FlatCompat({
  baseDirectory: dirname(fileURLToPath(import.meta.url)),
  recommendedConfig: js.configs.recommended,
});


export default [
    ...baseConfig,
    ...nx.configs["flat/angular"],
    ...compat.config({
        extends: [
            "plugin:@angular-eslint/template/process-inline-templates"
        ],
        plugins: [
            "@angular-eslint/eslint-plugin",
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
                    "libs/products/product-detail-page/tsconfig.*?.json"
                ]
            }
        }
    })),
    ...nx.configs["flat/angular-template"],
    {
        ignores: [
            "out-tsc",
            "src/test-setup.ts"
        ]
    }
];
