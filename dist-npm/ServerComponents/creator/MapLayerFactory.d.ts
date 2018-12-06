import express = require('express');
import MessageBus = require('../bus/MessageBus');
import IAddressSource = require('../database/IAddressSource');
import IGeoJsonFeature = require('./IGeoJsonFeature');
import Api = require('../api/ApiManager');
import IProperty = Api.IProperty;
export interface ILayerDefinition {
    projectTitle: string;
    reference: string;
    group: string;
    layerTitle: string;
    description: string;
    featureType: string;
    geometryType: string;
    parameter1: string;
    parameter2: string;
    parameter3: string;
    parameter4: string;
    iconUri: string;
    iconSize: number;
    drawingMode: string;
    fillColor: string;
    strokeColor: string;
    selectedStrokeColor: string;
    strokeWidth: number;
    isEnabled: boolean;
    fitToMap: boolean;
    clusterLevel: number;
    useClustering: boolean;
    opacity: number;
    nameLabel: string;
    includeOriginalProperties: boolean;
    defaultFeatureType: string;
    geometryFile: string;
    geometryKey: string;
}
export interface IPropertyType {
    label?: string;
    title?: string;
    description?: string;
    type?: string;
    section?: string;
    stringFormat?: string;
    visibleInCallOut?: boolean;
    canEdit?: boolean;
    filterType?: string;
    isSearchable?: boolean;
    minValue?: number;
    maxValue?: number;
    defaultValue?: number;
    count?: number;
    calculation?: string;
    subject?: string;
    target?: string;
    targetlayers?: string[];
    targetproperty?: string;
    options?: string[];
    activation?: string;
    targetid?: string;
}
export interface ILayerTemplate {
    layerDefinition: ILayerDefinition[];
    propertyTypes: IPropertyType[];
    properties: IProperty[];
    sensors?: IProperty[];
    projectId?: string;
    projectLogo?: string;
    iconBase64?: string;
    logoBase64?: string;
}
export interface IBagContourRequest {
    bounds?: string;
    searchProp?: string;
    layer: any;
}
export interface IBagSearchRequest {
    query: string;
    nrItems: number;
}
/** A factory class to create new map layers based on input, e.g. from Excel */
export declare class MapLayerFactory {
    private addressSources;
    private messageBus;
    private workingDir;
    private apiRoute;
    templateFiles: IProperty[];
    featuresNotFound: any;
    apiManager: Api.ApiManager;
    constructor(addressSources: IAddressSource.IAddressSource[], messageBus: MessageBus.MessageBusService, apiManager: Api.ApiManager, workingDir?: string, apiRoute?: string);
    process(req: express.Request, res: express.Response): void;
    private splitJson;
    sendIconThroughApiManager(b64: string, folder: string, filePath: string): void;
    sendResourceThroughApiManager(data: any, resourceId: string): void;
    sendLayerThroughApiManager(data: any): void;
    processBagContours(req: express.Request, res: express.Response): void;
    processBagSearchQuery(req: express.Request, res: express.Response): void;
    processBagBuurten(req: express.Request, res: express.Response): void;
    createMapLayer(template: ILayerTemplate, callback: (Object: any) => void): {
        type: string;
        featureTypes: {};
        features: IGeoJsonFeature[];
    };
    addGeometryRequest(req: express.Request, res: express.Response): void;
    private addGeometry;
    private getPolygonType;
    private determineType;
    /**
     * This function extracts the timestamps and sensorvalues from the
     * template.propertyTypes. Every sensorvalue is parsed as propertyType in
     * MS Excel, which should be converted to a sensor-array for each feature.
     * @param  {ILayerTemplate} template : The input template coming from MS Excel
     * @return {array} timestamps        : An array with all date/times converted to milliseconds
     */
    private convertTimebasedPropertyData;
    private createPolygonFeature;
    private enrichFeature;
    private createInternationalFeature;
    private createLatLonFeature;
    /**
     * Convert the RD coordinate to WGS84.
     */
    private createRDFeature;
    private mergeHouseNumber;
    private createPointFeature;
    private createCityFeature;
    private createFeatureWithoutGeometry;
    private createFeature;
    private createPropertyType;
    private convertTime;
    private convertDateProperties;
    private convertTypes;
    private convertStringFormats;
}
