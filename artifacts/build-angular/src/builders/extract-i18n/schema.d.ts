/**
 * Extract i18n target options for Build Facade.
 */
export interface Schema {
    /**
     * A browser builder target to extract i18n messages in the format of
     * `project:target[:configuration]`. You can also pass in more than one configuration name
     * as a comma-separated list. Example: `project:target:production,staging`.
     */
    browserTarget: string;
    /**
     * Output format for the generated file.
     */
    format?: Format;
    /**
     * Name of the file to output.
     */
    outFile?: string;
    /**
     * Path where output will be placed.
     */
    outputPath?: string;
    /**
     * Log progress to the console.
     */
    progress?: boolean;
}
/**
 * Output format for the generated file.
 */
export declare enum Format {
    Arb = "arb",
    Json = "json",
    LegacyMigrate = "legacy-migrate",
    Xlf = "xlf",
    Xlf2 = "xlf2",
    Xlif = "xlif",
    Xliff = "xliff",
    Xliff2 = "xliff2",
    Xmb = "xmb"
}
