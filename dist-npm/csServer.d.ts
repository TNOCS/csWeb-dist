import * as core from 'express-serve-static-core';
import csweb = require('./index');
export declare class csServerOptions {
    port: number;
    swagger: boolean;
    connectors: Object;
    /** If true (default), use CORRS. Optionally, specify the supported methods in corsSupportedMethods. */
    corrsEnabled: boolean;
    /** Comma separated string with CORRS messages, e.g. POST, PATCH, GET (default), OPTIONS, DELETE, PUT */
    corrsSupportedMethods: string;
}
export declare class csServer {
    dir: string;
    options: csServerOptions;
    server: core.Express;
    cm: csweb.ConnectionManager;
    messageBus: csweb.MessageBusService;
    httpServer: any;
    config: csweb.ConfigurationService;
    api: csweb.ApiManager;
    constructor(dir: string, options?: csServerOptions);
    start(started: Function): void;
    private gracefulShutdown();
}
