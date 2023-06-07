/**
 * App Shell target options for Build Facade.
 */
export interface Schema {
    /**
     * Script that exports the Server AppModule to render. This should be the main JavaScript
     * outputted by the server target. By default we will resolve the outputPath of the
     * serverTarget and find a bundle named 'main' in it (whether or not there's a hash tag).
     */
    appModuleBundle?: string;
    /**
     * A browser builder target use for rendering the application shell in the format of
     * `project:target[:configuration]`. You can also pass in more than one configuration name
     * as a comma-separated list. Example: `project:target:production,staging`.
     */
    browserTarget: string;
    /**
     * The input path for the index.html file. By default uses the output index.html of the
     * browser target.
     */
    inputIndexPath?: string;
    /**
     * The output path of the index.html file. By default will overwrite the input file.
     */
    outputIndexPath?: string;
    /**
     * The route to render.
     */
    route?: string;
    /**
     * A server builder target use for rendering the application shell in the format of
     * `project:target[:configuration]`. You can also pass in more than one configuration name
     * as a comma-separated list. Example: `project:target:production,staging`.
     */
    serverTarget: string;
}
