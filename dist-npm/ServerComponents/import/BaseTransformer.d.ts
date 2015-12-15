import transform = require("./ITransform");
declare class BaseTransformer implements transform.ITransform {
    title: string;
    id: string;
    description: string;
    type: any;
    /**
     * Accepted input types.
     */
    inputDataTypes: transform.InputDataType[];
    /**
     * Generated output types.
     */
    outputDataTypes: transform.OutputDataType[];
    initialize(): void;
    constructor(title: string);
}
export = BaseTransformer;
