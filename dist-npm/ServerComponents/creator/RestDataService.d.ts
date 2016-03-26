import express = require('express');
import Api = require('../api/ApiManager');
export interface IRestDataSourceSettings {
    converterFile: string;
    url: string;
    /** Parameters to include in the url (e.g. ./endpoint?api_key=value) */
    urlParams?: {
        [key: string]: any;
    };
    pollIntervalSeconds?: number;
    pruneIntervalSeconds?: number;
    diffIgnoreGeometry?: boolean;
    diffPropertiesBlacklist?: string[];
    diffPropertiesWhitelist?: string[];
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
    constructor(server: express.Express, apiManager: Api.ApiManager, layerId: string, url?: string);
    init(options: IRestDataSourceSettings, callback: Function): void;
    private startRestPolling(dataParameters);
    private initFeatures(fCollection, updateTime);
    private findFeatureDiff(fCollection, updateTime);
    private isFeatureUpdated(f);
    private isConverterValid();
}
