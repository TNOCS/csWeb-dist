/// <reference types="node" />
import transform = require("./ITransform");
declare class GeoJsonFeaturesTransformer implements transform.ITransform {
    title: string;
    id: string;
    description: string;
    type: string;
    headers: string[];
    /**
     * Accepted input types.
     */
    inputDataTypes: transform.InputDataType[];
    /**
     * Generated output types.
     */
    outputDataTypes: transform.OutputDataType[];
    constructor(title: string);
    initialize(opt: any, callback: any): void;
    create(config: any, opt?: transform.ITransformFactoryOptions[]): NodeJS.ReadWriteStream;
}
export = GeoJsonFeaturesTransformer;
