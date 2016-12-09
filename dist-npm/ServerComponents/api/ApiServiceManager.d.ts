import express = require('express');
import ConfigurationService = require('../configuration/ConfigurationService');
import IApiService = require('./IApiService');
import IApiServiceManager = require('./IApiServiceManager');
export declare class ApiServiceManager implements IApiServiceManager {
    private server;
    private config;
    private baseUrl;
    private dataUrl;
    private apiServices;
    constructor(server: express.Express, config: ConfigurationService.ConfigurationService);
    readonly BaseUrl: string;
    readonly DataUrl: string;
    /**
     * Add a service, initialize it, and return the service GUID.
     */
    addService(service: IApiService): string;
    /**
     * Find a service by ID (GUID). Returns null when no matching service is found.
     */
    findServiceById(serviceId: string): IApiService;
    /**
     * Remove service by ID (GUID).
     */
    removeService(serviceId: string): void;
}
