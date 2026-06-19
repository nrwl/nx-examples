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
        plugins: [
            "eslint-plugin-import",
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
                    prefix: "app",
                    style: "camelCase"
                }
            ],
            "@angular-eslint/component-selector": [
                "error",
                {
                    type: "element",
                    prefix: "app",
                    style: "kebab-case"
                }
            ],
            "@angular-eslint/no-input-rename": "error",
            "@angular-eslint/no-inputs-metadata-property": "error",
            "@angular-eslint/no-output-native": "error",
            "@angular-eslint/no-output-on-prefix": "error",
            "@angular-eslint/no-output-rename": "error",
            "@angular-eslint/no-outputs-metadata-property": "error",
            "@angular-eslint/use-lifecycle-interface": "error",
            "@angular-eslint/use-pipe-transform-interface": "error",
            "@typescript-eslint/consistent-type-definitions": "error",
            "@typescript-eslint/dot-notation": "off",
            "@typescript-eslint/explicit-member-accessibility": [
                "off",
                {
                    accessibility: "explicit"
                }
            ],
            "@typescript-eslint/member-ordering": "error",
            "@typescript-eslint/naming-convention": "error",
            "@typescript-eslint/no-empty-function": "off",
            "@typescript-eslint/no-empty-interface": "error",
            "@typescript-eslint/no-inferrable-types": [
                "error",
                {
                    ignoreParameters: true
                }
            ],
            "@typescript-eslint/no-misused-new": "error",
            "@typescript-eslint/no-non-null-assertion": "error",
            "@typescript-eslint/no-shadow": [
                "error",
                {
                    hoist: "all"
                }
            ],
            "@typescript-eslint/no-unused-expressions": "error",
            "@typescript-eslint/prefer-function-type": "error",
            "@typescript-eslint/unified-signatures": "error",
            "arrow-body-style": "error",
            "constructor-super": "error",
            eqeqeq: [
                "error",
                "smart"
            ],
            "guard-for-in": "error",
            "id-blacklist": "off",
            "id-match": "off",
            "import/no-deprecated": "warn",
            "import/order": "error",
            "no-bitwise": "error",
            "no-caller": "error",
            "no-console": [
                "error",
                {
                    allow: [
                        "log",
                        "warn",
                        "dir",
                        "timeLog",
                        "assert",
                        "clear",
                        "count",
                        "countReset",
                        "group",
                        "groupEnd",
                        "table",
                        "dirxml",
                        "error",
                        "groupCollapsed",
                        "Console",
                        "profile",
                        "profileEnd",
                        "timeStamp",
                        "context"
                    ]
                }
            ],
            "no-debugger": "error",
            "no-empty": "off",
            "no-eval": "error",
            "no-fallthrough": "error",
            "no-new-wrappers": "error",
            "no-restricted-imports": [
                "error",
                "rxjs/Rx"
            ],
            "no-throw-literal": "error",
            "no-undef-init": "error",
            "no-underscore-dangle": "off",
            "no-var": "error",
            "prefer-const": "error",
            radix: "error"
        },
        languageOptions: {
            parserOptions: {
                project: [
                    "libs/cart/cart-page/tsconfig.*?.json"
                ]
            }
        }
    })),
    ...nx.configs["flat/angular-template"],
    {
        files: [
            "**/*.html"
        ],
        rules: {
            "@angular-eslint/template/banana-in-box": "error",
            "@angular-eslint/template/no-negated-async": "error",
            "@angular-eslint/template/eqeqeq": "error"
        }
    },
    {
        ignores: [
            "out-tsc",
            "src/test-setup.ts"
        ]
    }
];
