"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var InputDataType;
(function (InputDataType) {
    InputDataType[InputDataType["file"] = 0] = "file";
    InputDataType[InputDataType["url"] = 1] = "url";
    InputDataType[InputDataType["mongo"] = 2] = "mongo";
    InputDataType[InputDataType["pg"] = 3] = "pg";
    InputDataType[InputDataType["shape"] = 4] = "shape";
    InputDataType[InputDataType["geojson"] = 5] = "geojson";
    InputDataType[InputDataType["zip"] = 6] = "zip";
})(InputDataType = exports.InputDataType || (exports.InputDataType = {}));
var OutputDataType;
(function (OutputDataType) {
    OutputDataType[OutputDataType["file"] = 0] = "file";
    OutputDataType[OutputDataType["geojson"] = 1] = "geojson";
    OutputDataType[OutputDataType["mongo"] = 2] = "mongo";
    OutputDataType[OutputDataType["pg"] = 3] = "pg";
})(OutputDataType = exports.OutputDataType || (exports.OutputDataType = {}));
// import s = require('stream');
// class t {
//     constructor() {
//         var opts: stream.TransformOptions = {
//
//         }
//         _transform(chunk: string | Buffer, encoding: string, callback: Function);
//         new(opt?: stream.TransformOptions);
//         var transform = new stream.Transform();
//         transform._transform()
//         transform.pipe()
//     }
// }
//# sourceMappingURL=ITransform.js.map