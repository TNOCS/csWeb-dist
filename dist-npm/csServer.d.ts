import * as core from 'express-serve-static-core';
import csweb = require('./index');
export declare class csServerOptions {
    port: number;
    apiFolder: string;
    swagger: boolean;
    connectors: Object;
    /** If true (default), use CORRS. Optionally, specify the supported methods in corsSupportedMethods. */
    corrsEnabled: boolean;
    /** Comma separated string with CORRS messages, e.g. POST, PATCH, GET (default), OPTIONS, DELETE, PUT */
    corrsSupportedMethods: string;
}
/**
 * Optional start options that you can use to start the server instead of loading the
 * configuration from file. This is type-safe, and easier when testing the server.
 *
 * @export
 * @interface StartOptions
 */
export interface StartOptions {
    bagConnectionString?: string;
    resolveAddress?: string;
    [key: string]: any;
}
export declare class csServer {
    dir: string;
    options: csweb.csServerOptions;
    server: core.Express;
    cm: csweb.ConnectionManager;
    messageBus: csweb.MessageBusService;
    httpServer: any;
    config: csweb.ConfigurationService;
    api: csweb.ApiManager;
    private apiFolder;
    constructor(dir: string, options?: csweb.csServerOptions);
    start(started: Function, options?: StartOptions): void;
    private gracefulShutdown();
}
