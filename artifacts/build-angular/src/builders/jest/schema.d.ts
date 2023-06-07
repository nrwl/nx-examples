/**
 * Jest target options
 */
export interface Schema {
    /**
     * Globs of files to exclude, relative to the project root.
     */
    exclude?: string[];
    /**
     * Globs of files to include, relative to project root.
     */
    include?: string[];
    /**
     * Polyfills to be included in the build.
     */
    polyfills?: Polyfills;
    /**
     * The name of the TypeScript configuration file.
     */
    tsConfig: string;
}
/**
 * Polyfills to be included in the build.
 */
export type Polyfills = string[] | string;
