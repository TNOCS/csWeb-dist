import transform = require("./ITransform");
declare class GeoJsonSplitTransformer implements transform.ITransform {
    title: string;
    id: string;
    description: string;
    type: string;
    /**
     * Accepted input types.
     */
    inputDataTypes: transform.InputDataType[];
    /**
     * Generated output types.
     */
    outputDataTypes: transform.OutputDataType[];
    geometry: any;
    keyProperty: string;
    identifierProperty: string;
    constructor(title: string);
    initialize(opt: transform.ITransformFactoryOptions, callback: (error) => void): void;
    create(config: any, opt?: transform.ITransformFactoryOptions): NodeJS.ReadWriteStream;
}
export = GeoJsonSplitTransformer;
