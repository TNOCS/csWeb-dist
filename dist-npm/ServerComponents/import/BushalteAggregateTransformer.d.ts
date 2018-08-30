/// <reference types="node" />
import transform = require('./ITransform');
declare class BushalteAggregateTransformer implements transform.ITransform {
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
    aggregateShapeUrl: string;
    aggregateShapeKeyProperty: string;
    constructor(title: string);
    initialize(opt: transform.ITransformFactoryOptions, callback: (error: any) => void): void;
    create(config: any, opt?: transform.ITransformFactoryOptions): NodeJS.ReadWriteStream;
}
export = BushalteAggregateTransformer;
