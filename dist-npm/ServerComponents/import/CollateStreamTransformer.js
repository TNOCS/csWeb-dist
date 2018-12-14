"use strict";
var Utils = require("../helpers/Utils");
var stream = require("stream");
var CollateStreamTransformer = (function () {
    //create?(opt?: ITransformFactoryOptions[]): stream.Readable | stream.Writable | stream.Transform;
    function CollateStreamTransformer(title) {
        this.title = title;
        this.type = "CollateStreamTransformer";
        this.headers = null;
        this.id = Utils.newGuid();
        //this.description = description;
    }
    CollateStreamTransformer.prototype.initialize = function (opt, callback) {
        callback(null);
    };
    CollateStreamTransformer.prototype.create = function (config, opt) {
        var t = new stream.Transform();
        /*stream.Transform.call(t);*/
        var split = -1;
        var buffer = "";
        t.setEncoding("utf8");
        t._transform = function (chunk, encoding, done) {
            // console.log("##### CST #####");
            var strChunk = chunk.toString("utf8");
            buffer += strChunk;
            done();
        };
        t._flush = function (done) {
            try {
                /*console.log("push buffer: ");*/
                /*console.log(buffer);*/
                if (buffer) {
                    t.push(buffer);
                    buffer = null;
                }
                done();
            }
            catch (error) {
                done();
            }
        };
        return t;
    };
    return CollateStreamTransformer;
}());
module.exports = CollateStreamTransformer;
//# sourceMappingURL=CollateStreamTransformer.js.map