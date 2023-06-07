export declare class ProgressPlugin {
    /**
     * @param {Compiler} compiler the current compiler
     * @returns {ReportProgress} a progress reporter, if any
     */
    static getReporter(compiler: any): any;
    /**
     * @param {ProgressPluginArgument} options options
     */
    constructor(options?: {});
    /**
     * @param {Compiler | MultiCompiler} compiler webpack compiler
     * @returns {void}
     */
    apply(compiler: any): void;
    /**
     * @param {MultiCompiler} compiler webpack multi-compiler
     * @param {HandlerFunction} handler function that executes for every progress step
     * @returns {void}
     */
    _applyOnMultiCompiler(compiler: any, handler: any): void;
    /**
     * @param {Compiler} compiler webpack compiler
     * @param {HandlerFunction} handler function that executes for every progress step
     * @returns {void}
     */
    _applyOnCompiler(compiler: any, handler: any): void;
}
