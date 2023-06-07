/**
 * Browser target options
 */
export interface Schema {
    /**
     * A list of CommonJS packages that are allowed to be used without a build time warning.
     */
    allowedCommonJsDependencies?: string[];
    /**
     * Build using Ahead of Time compilation.
     */
    aot?: boolean;
    /**
     * List of static application assets.
     */
    assets?: AssetPattern[];
    /**
     * Base url for the application being built.
     */
    baseHref?: string;
    /**
     * Budget thresholds to ensure parts of your application stay within boundaries which you
     * set.
     */
    budgets?: Budget[];
    /**
     * Enables advanced build optimizations when using the 'aot' option.
     */
    buildOptimizer?: boolean;
    /**
     * Generate a seperate bundle containing code used across multiple bundles.
     */
    commonChunk?: boolean;
    /**
     * Define the crossorigin attribute setting of elements that provide CORS support.
     */
    crossOrigin?: CrossOrigin;
    /**
     * Delete the output path before building.
     */
    deleteOutputPath?: boolean;
    /**
     * URL where files will be deployed.
     * @deprecated Use "baseHref" option, "APP_BASE_HREF" DI token or a combination of both
     * instead. For more information, see https://angular.io/guide/deployment#the-deploy-url.
     */
    deployUrl?: string;
    /**
     * Exclude the listed external dependencies from being bundled into the bundle. Instead, the
     * created bundle relies on these dependencies to be available during runtime.
     */
    externalDependencies?: string[];
    /**
     * Extract all licenses in a separate file.
     */
    extractLicenses?: boolean;
    /**
     * Replace compilation source files with other compilation source files in the build.
     */
    fileReplacements?: FileReplacement[];
    /**
     * How to handle duplicate translations for i18n.
     */
    i18nDuplicateTranslation?: I18NTranslation;
    /**
     * How to handle missing translations for i18n.
     */
    i18nMissingTranslation?: I18NTranslation;
    /**
     * Configures the generation of the application's HTML index.
     */
    index: any;
    /**
     * The stylesheet language to use for the application's inline component styles.
     */
    inlineStyleLanguage?: InlineStyleLanguage;
    /**
     * Translate the bundles in one or more locales.
     */
    localize?: Localize;
    /**
     * The full path for the main entry point to the app, relative to the current workspace.
     */
    main: string;
    /**
     * Use file name for lazy loaded chunks.
     */
    namedChunks?: boolean;
    /**
     * Path to ngsw-config.json.
     */
    ngswConfigPath?: string;
    /**
     * Enables optimization of the build output. Including minification of scripts and styles,
     * tree-shaking, dead-code elimination, inlining of critical CSS and fonts inlining. For
     * more information, see
     * https://angular.io/guide/workspace-config#optimization-configuration.
     */
    optimization?: OptimizationUnion;
    /**
     * Define the output filename cache-busting hashing mode.
     */
    outputHashing?: OutputHashing;
    /**
     * The full path for the new output directory, relative to the current workspace.
     * By default, writes output to a folder named dist/ in the current project.
     */
    outputPath: string;
    /**
     * Enable and define the file watching poll time period in milliseconds.
     */
    poll?: number;
    /**
     * Polyfills to be included in the build.
     */
    polyfills?: Polyfills;
    /**
     * Do not use the real path when resolving modules. If unset then will default to `true` if
     * NodeJS option --preserve-symlinks is set.
     */
    preserveSymlinks?: boolean;
    /**
     * Log progress to the console while building.
     */
    progress?: boolean;
    /**
     * The path where style resources will be placed, relative to outputPath.
     */
    resourcesOutputPath?: string;
    /**
     * Global scripts to be included in the build.
     */
    scripts?: ScriptElement[];
    /**
     * Generates a service worker config for production builds.
     */
    serviceWorker?: boolean;
    /**
     * Output source maps for scripts and styles. For more information, see
     * https://angular.io/guide/workspace-config#source-map-configuration.
     */
    sourceMap?: SourceMapUnion;
    /**
     * Generates a 'stats.json' file which can be analyzed using tools such as
     * 'webpack-bundle-analyzer'.
     */
    statsJson?: boolean;
    /**
     * Options to pass to style preprocessors.
     */
    stylePreprocessorOptions?: StylePreprocessorOptions;
    /**
     * Global styles to be included in the build.
     */
    styles?: StyleElement[];
    /**
     * Enables the use of subresource integrity validation.
     */
    subresourceIntegrity?: boolean;
    /**
     * The full path for the TypeScript configuration file, relative to the current workspace.
     */
    tsConfig: string;
    /**
     * Generate a seperate bundle containing only vendor libraries. This option should only be
     * used for development to reduce the incremental compilation time.
     */
    vendorChunk?: boolean;
    /**
     * Adds more details to output logging.
     */
    verbose?: boolean;
    /**
     * Run build when files change.
     */
    watch?: boolean;
    /**
     * TypeScript configuration for Web Worker modules.
     */
    webWorkerTsConfig?: string;
}
export type AssetPattern = AssetPatternClass | string;
export interface AssetPatternClass {
    /**
     * Allow glob patterns to follow symlink directories. This allows subdirectories of the
     * symlink to be searched.
     */
    followSymlinks?: boolean;
    /**
     * The pattern to match.
     */
    glob: string;
    /**
     * An array of globs to ignore.
     */
    ignore?: string[];
    /**
     * The input directory path in which to apply 'glob'. Defaults to the project root.
     */
    input: string;
    /**
     * Absolute path within the output.
     */
    output: string;
}
export interface Budget {
    /**
     * The baseline size for comparison.
     */
    baseline?: string;
    /**
     * The threshold for error relative to the baseline (min & max).
     */
    error?: string;
    /**
     * The maximum threshold for error relative to the baseline.
     */
    maximumError?: string;
    /**
     * The maximum threshold for warning relative to the baseline.
     */
    maximumWarning?: string;
    /**
     * The minimum threshold for error relative to the baseline.
     */
    minimumError?: string;
    /**
     * The minimum threshold for warning relative to the baseline.
     */
    minimumWarning?: string;
    /**
     * The name of the bundle.
     */
    name?: string;
    /**
     * The type of budget.
     */
    type: Type;
    /**
     * The threshold for warning relative to the baseline (min & max).
     */
    warning?: string;
}
/**
 * The type of budget.
 */
export declare enum Type {
    All = "all",
    AllScript = "allScript",
    Any = "any",
    AnyComponentStyle = "anyComponentStyle",
    AnyScript = "anyScript",
    Bundle = "bundle",
    Initial = "initial"
}
/**
 * Define the crossorigin attribute setting of elements that provide CORS support.
 */
export declare enum CrossOrigin {
    Anonymous = "anonymous",
    None = "none",
    UseCredentials = "use-credentials"
}
export interface FileReplacement {
    replace: string;
    with: string;
}
/**
 * How to handle duplicate translations for i18n.
 *
 * How to handle missing translations for i18n.
 */
export declare enum I18NTranslation {
    Error = "error",
    Ignore = "ignore",
    Warning = "warning"
}
/**
 * The stylesheet language to use for the application's inline component styles.
 */
export declare enum InlineStyleLanguage {
    Css = "css",
    Less = "less",
    Sass = "sass",
    Scss = "scss"
}
/**
 * Translate the bundles in one or more locales.
 */
export type Localize = string[] | boolean;
/**
 * Enables optimization of the build output. Including minification of scripts and styles,
 * tree-shaking, dead-code elimination, inlining of critical CSS and fonts inlining. For
 * more information, see
 * https://angular.io/guide/workspace-config#optimization-configuration.
 */
export type OptimizationUnion = boolean | OptimizationClass;
export interface OptimizationClass {
    /**
     * Enables optimization for fonts. This option requires internet access. `HTTPS_PROXY`
     * environment variable can be used to specify a proxy server.
     */
    fonts?: FontsUnion;
    /**
     * Enables optimization of the scripts output.
     */
    scripts?: boolean;
    /**
     * Enables optimization of the styles output.
     */
    styles?: StylesUnion;
}
/**
 * Enables optimization for fonts. This option requires internet access. `HTTPS_PROXY`
 * environment variable can be used to specify a proxy server.
 */
export type FontsUnion = boolean | FontsClass;
export interface FontsClass {
    /**
     * Reduce render blocking requests by inlining external Google Fonts and Adobe Fonts CSS
     * definitions in the application's HTML index file. This option requires internet access.
     * `HTTPS_PROXY` environment variable can be used to specify a proxy server.
     */
    inline?: boolean;
}
/**
 * Enables optimization of the styles output.
 */
export type StylesUnion = boolean | StylesClass;
export interface StylesClass {
    /**
     * Extract and inline critical CSS definitions to improve first paint time.
     */
    inlineCritical?: boolean;
    /**
     * Minify CSS definitions by removing extraneous whitespace and comments, merging
     * identifiers and minimizing values.
     */
    minify?: boolean;
}
/**
 * Define the output filename cache-busting hashing mode.
 */
export declare enum OutputHashing {
    All = "all",
    Bundles = "bundles",
    Media = "media",
    None = "none"
}
/**
 * Polyfills to be included in the build.
 */
export type Polyfills = string[] | string;
export type ScriptElement = ScriptClass | string;
export interface ScriptClass {
    /**
     * The bundle name for this extra entry point.
     */
    bundleName?: string;
    /**
     * If the bundle will be referenced in the HTML file.
     */
    inject?: boolean;
    /**
     * The file to include.
     */
    input: string;
}
/**
 * Output source maps for scripts and styles. For more information, see
 * https://angular.io/guide/workspace-config#source-map-configuration.
 */
export type SourceMapUnion = boolean | SourceMapClass;
export interface SourceMapClass {
    /**
     * Output source maps used for error reporting tools.
     */
    hidden?: boolean;
    /**
     * Output source maps for all scripts.
     */
    scripts?: boolean;
    /**
     * Output source maps for all styles.
     */
    styles?: boolean;
    /**
     * Resolve vendor packages source maps.
     */
    vendor?: boolean;
}
/**
 * Options to pass to style preprocessors.
 */
export interface StylePreprocessorOptions {
    /**
     * Paths to include. Paths will be resolved to workspace root.
     */
    includePaths?: string[];
}
export type StyleElement = StyleClass | string;
export interface StyleClass {
    /**
     * The bundle name for this extra entry point.
     */
    bundleName?: string;
    /**
     * If the bundle will be referenced in the HTML file.
     */
    inject?: boolean;
    /**
     * The file to include.
     */
    input: string;
}
