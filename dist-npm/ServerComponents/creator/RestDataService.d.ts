import express = require('express');
import Api = require('../api/ApiManager');
export interface IRestDataSourceSettings {
    /** File that contains functions obtain and parse the desired data (e.g. ./crowdtasker) */
    converterFile: string;
    /** Base url where the data should be obtained from (e.g. http://www.mydatasource.com/endpoint) */
    url: string;
    /** Parameters to include in the url (e.g. {api_key:"value"} adds to the url: ?api_key=value) */
    urlParams?: {
        [key: string]: any;
    };
    /** Time interval in seconds to check for updates */
    pollIntervalSeconds?: number;
    /** Time period in seconds to keep objects that are not in the obtained data anymore. This is useful when a connection to
     *  a feature may be lost for short periods, but the feature should remain visible on the map.
     */
    pruneIntervalSeconds?: number;
    /** Whether the geometry of features should be ignored when feature diffs are calculated. (default: false) */
    diffIgnoreGeometry?: boolean;
    /** Properties that should be ignored when calculating feature diffs (can be overridden by whitelist) */
    diffPropertiesBlacklist?: string[];
    /** Properties that should be used for calculating feature diffs (takes precendence of blacklist) */
    diffPropertiesWhitelist?: string[];
    /** Date property */
    dateProperty?: string;
    /** Time property */
    timeProperty?: string;
    /** Date format */
    dateFormat?: string;
    /** Time format */
    timeFormat?: string;
    /** Ignore aged features */
    maxFeatureAgeMinutes?: number;
    /** When filename is given, the retrieved data will be written to that file. Otherwise, logging is disabled */
    logFile?: string;
}
export interface IConverter {
    getData: Function;
}
/** REST datasource
 *  Provides an endpoint for obtaining features from a REST source. The features can be provided in many forms,
 *  as they will be converted by a specific converter-JavaScript file. The converter takes care of the conversion
 *  from the format used by the REST source to GeoJSON.
 *  Furthermore the datasource will request the GeoJSON features on a certain interval. Only the features that have
 *  been updated in the interval period will be pushed to the client. Next to the polling interval, a prune period
 *  can be configured. When features have not been updated within the prune period, they will be deleted.
 */
export declare class RestDataSource {
    server: express.Express;
    private apiManager;
    layerId: string;
    url: string;
    /** Dictionary of feature id's and information regarding the features and feature0updates */
    private features;
    /** Features that should be added on the client */
    private featuresUpdates;
    private restDataSourceUrl;
    private converter;
    private restDataSourceOpts;
    private counter;
    private enableLogging;
    constructor(server: express.Express, apiManager: Api.ApiManager, layerId: string, url?: string);
    init(options: IRestDataSourceSettings, callback: Function): void;
    private startRestPolling;
    private filterOldEntries;
    private initFeatures;
    private findFeatureDiff;
    private isFeatureUpdated;
    private isConverterValid;
}
