import express = require('express');
import Api = require('../api/ApiManager');
export interface ICISOptions {
    sendMessageUrl?: string;
    cisMsgReceivedUrl?: string;
    cisNotifyUrl?: string;
}
export interface ICISMessage {
    msg: ICAPAlert;
    msgType: string;
    deParameters: {
        [key: string]: any;
    };
}
export interface IDEParameters {
    id: string;
    senderId: string;
    dateTimeSent: string;
    status: string;
    kind: string;
    descriptionType?: string;
    contentType?: string;
    contentObjectType?: string;
}
export interface ICAPAlert {
    identifier: string;
    sender: string;
    sent: string;
    status: string;
    msgType: string;
    scope: string;
    addresses?: string;
    references?: string[];
    info: ICAPInfo;
}
export interface ICAPInfo {
    senderName?: string;
    event: string;
    description?: string;
    category: string;
    severity: string;
    certainty: string;
    urgency: string;
    onset?: string;
    eventCode?: string;
    headline?: string;
    expires?: string;
    responseType?: string;
    instruction?: string;
    area: ICAPArea;
}
export interface ICAPArea {
    areaDesc: string;
    polygon?: Object;
    point?: Object;
}
/** CIS datasource
 *  Provides an endpoint for obtaining and sending CIS messages
 */
export declare class CISDataSource {
    server: express.Express;
    private apiManager;
    capLayerId: string;
    url: string;
    private cisOptions;
    private xmlBuilder;
    private xmlParser;
    constructor(server: express.Express, apiManager: Api.ApiManager, capLayerId: string, url?: string);
    init(options: ICISOptions, callback: Function): void;
    private parseCisMessage;
    private convertCapFeature;
    /**
     * Flattens a nested object to a flat dictionary.
     * Example:
     * { X: 1, Y: {Ya: 2, Yb: 3}}
     *       }
     * }
     * to {X: 1, Ya: 2, Yb: 3}
     */
    private static flattenObject;
    private static createDefaultCISMessage;
    /**
     * Takes a date object, outputs a CAP date string
     */
    private static convertDateToCAPDate;
    /**
     * Takes a a GeoJSON Polygon or Point {type, coordinates: [[y,x],[y,x]]} (WGS84)
     * Outputs a CAP Polygon in the format: "x,y x,y x,y" or Circle in the format "x,y r" (r in km)
     * Optionally provide a circle radius in km, in case a point is provided (default: 10km)
     */
    private static convertGeoJSONToCAPGeometry;
    /**
     * Takes a CAP Polygon in the format: "x,y x,y x,y". (WGS84)
     * Outputs a GeoJSON geometry {type, coordinates: [[y,x],[y,x]]}.
     */
    private static convertCAPGeometryToGeoJSON;
}
