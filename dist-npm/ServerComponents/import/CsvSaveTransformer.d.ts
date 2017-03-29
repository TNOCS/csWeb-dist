/// <reference types="node" />
import transform = require('./ITransform');
declare class CsvSaveTransformer implements transform.ITransform {
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
    targetFolder: string;
    filenameKey: string;
    filename: string;
    headers: string;
    rows: string[];
    generateMetadata: boolean;
    generateKeysOnly: boolean;
    nameLabel: string;
    FeatureTypeId: string;
    constructor(title: string);
    initialize(opt: transform.ITransformFactoryOptions, callback: (error) => void): void;
    create(config: any, opt?: transform.ITransformFactoryOptions): NodeJS.ReadWriteStream;
}
export = CsvSaveTransformer;
