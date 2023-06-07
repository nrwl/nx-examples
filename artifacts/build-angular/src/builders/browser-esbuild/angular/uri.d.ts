/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
/**
 * A string value representing the namespace for Angular JIT mode related imports for
 * Component styles. This namespace is used for both inline (`styles`) and external
 * (`styleUrls`) styles.
 */
export declare const JIT_STYLE_NAMESPACE: "angular:jit:style";
/**
 * A string value representing the namespace for Angular JIT mode related imports for
 * Component templates. This namespace is currently only used for external (`templateUrl`)
 * templates.
 */
export declare const JIT_TEMPLATE_NAMESPACE: "angular:jit:template";
/**
 * A regular expression that can be used to match a Angular JIT mode namespace URI.
 * It contains capture groups for the type (template/style), origin (file/inline), and specifier.
 * The {@link parseJitUri} function can be used to parse and return an object representation of a JIT URI.
 */
export declare const JIT_NAMESPACE_REGEXP: RegExp;
/**
 * Generates an Angular JIT mode namespace URI for a given file.
 * @param file The path of the file to be included.
 * @param type The type of the file (`style` or `template`).
 * @returns A string containing the full JIT namespace URI.
 */
export declare function generateJitFileUri(file: string, type: 'style' | 'template'): string;
/**
 * Generates an Angular JIT mode namespace URI for a given inline style or template.
 * The provided content is base64 encoded and included in the URI.
 * @param data The content to encode within the URI.
 * @param type The type of the content (`style` or `template`).
 * @returns A string containing the full JIT namespace URI.
 */
export declare function generateJitInlineUri(data: string | Uint8Array, type: 'style' | 'template'): string;
/**
 * Parses a string containing a JIT namespace URI.
 * JIT namespace URIs are used to encode the information for an Angular component's stylesheets
 * and templates when compiled in JIT mode.
 * @param uri The URI to parse into its underlying components.
 * @returns An object containing the namespace, type, origin, and specifier of the URI;
 * `undefined` if not a JIT namespace URI.
 */
export declare function parseJitUri(uri: string): {
    namespace: string;
    type: "style" | "template";
    origin: "inline" | "file";
    specifier: string;
} | undefined;
