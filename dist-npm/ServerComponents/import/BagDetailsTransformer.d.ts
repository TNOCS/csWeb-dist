import transform = require("./ITransform");
import ConfigurationService = require('../configuration/ConfigurationService');
declare class BagDetailsTransformer implements transform.ITransform {
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
    constructor(title: string);
    initialize(opt: any, callback: any): void;
    create(config: ConfigurationService.ConfigurationService, opt?: transform.ITransformFactoryOptions[]): NodeJS.ReadWriteStream;
}
export = BagDetailsTransformer;
