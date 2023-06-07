/**
 * Dev Server target options for Build Facade.
 */
export interface Schema {
    /**
     * List of hosts that are allowed to access the dev server.
     */
    allowedHosts?: string[];
    /**
     * A browser builder target to serve in the format of `project:target[:configuration]`. You
     * can also pass in more than one configuration name as a comma-separated list. Example:
     * `project:target:production,staging`.
     */
    browserTarget: string;
    /**
     * Don't verify connected clients are part of allowed hosts.
     */
    disableHostCheck?: boolean;
    /**
     * Custom HTTP headers to be added to all responses.
     */
    headers?: {
        [key: string]: string;
    };
    /**
     * Enable hot module replacement.
     */
    hmr?: boolean;
    /**
     * Host to listen on.
     */
    host?: string;
    /**
     * Whether to reload the page on change, using live-reload.
     */
    liveReload?: boolean;
    /**
     * Opens the url in default browser.
     */
    open?: boolean;
    /**
     * Enable and define the file watching poll time period in milliseconds.
     */
    poll?: number;
    /**
     * Port to listen on.
     */
    port?: number;
    /**
     * Proxy configuration file. For more information, see
     * https://angular.io/guide/build#proxying-to-a-backend-server.
     */
    proxyConfig?: string;
    /**
     * The URL that the browser client (or live-reload client, if enabled) should use to connect
     * to the development server. Use for a complex dev server setup, such as one with reverse
     * proxies.
     */
    publicHost?: string;
    /**
     * The pathname where the application will be served.
     */
    servePath?: string;
    /**
     * Serve using HTTPS.
     */
    ssl?: boolean;
    /**
     * SSL certificate to use for serving HTTPS.
     */
    sslCert?: string;
    /**
     * SSL key to use for serving HTTPS.
     */
    sslKey?: string;
    /**
     * Adds more details to output logging.
     */
    verbose?: boolean;
    /**
     * Rebuild on change.
     */
    watch?: boolean;
}
