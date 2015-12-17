import ApiManager = require('../api/ApiManager');
export interface IGeoJson {
    id?: string;
    /** Typically, this would be FeatureCollection */
    type?: string;
    features: ApiManager.Feature[];
    [key: string]: any;
}
/**
 * Simple helper class to easily create a GeoJSON file.
 */
export declare class GeoJSONFactory {
    /**
     * Create a GeoJSON file from an array of features.
     */
    static Create(features: ApiManager.Feature[]): IGeoJson;
}
export interface IGeoJsonGeometry {
    /** For example, Point, LineString, Polyline or Polygon */
    type: string;
    coordinates: any;
}
export interface IStringToAny {
    [key: string]: any;
}
export interface IFeature {
    id?: string;
    /** Typically, this would be Feature */
    type?: string;
    geometry?: IGeoJsonGeometry;
    properties?: IStringToAny;
    logs?: {};
    isInitialized?: boolean;
    /**
    * An optional dictionary of sensors, where each sensor or measurement represents the value of the sensor
    * at a certain point in time. Is often used with the layer's timestamp property in case all sensors have the same
    * number of measurements.
    */
    sensors?: {
        [id: string]: any[];
    };
    timestamps?: number[];
}
export interface IProperty {
    [key: string]: any;
}
/**
* A set of static geo tools
* Source: http://www.csgnetwork.com/degreelenllavcalc.html
*/
export declare class GeoExtensions {
    static deg2rad(degree: number): number;
    static rad2deg(rad: number): number;
    /**
     * Convert RD (Rijksdriehoek) coordinates to WGS84.
     * @param  {number} x [RD X coordinate]
     * @param  {number} y [RD Y coordinate]
     * @return {[type]}   [object with latitude and longitude coordinate in WGS84]
     * Source: http://home.solcon.nl/pvanmanen/Download/Transformatieformules.pdf, http://www.roelvanlisdonk.nl/?p=2950
     */
    static convertRDToWGS84(x: number, y: number): {
        latitude: number;
        longitude: number;
    };
    /**
    * Calculate the log base 10 of val
    */
    static log10(val: any): number;
    static convertDegreesToMeters(latitudeDegrees: number): {
        latitudeLength: number;
        longitudeLength: number;
    };
}
