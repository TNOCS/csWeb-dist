var Utils = require("../helpers/Utils");
var stream = require('stream');
var turf = require("turf");
var GeoJsonOutputTransformer = (function () {
    function GeoJsonOutputTransformer(title) {
        this.title = title;
        this.type = "GeoJsonOutputTransformer";
        this.geoJson = [];
        this.id = Utils.newGuid();
        //this.description = description;
    }
    GeoJsonOutputTransformer.prototype.initialize = function (opt, callback) {
        callback(null);
    };
    GeoJsonOutputTransformer.prototype.create = function (config, opt) {
        var _this = this;
        var t = new stream.Transform();
        /*stream.Transform.call(t);*/
        this.geoJson = [];
        t.setEncoding("utf8");
        t._transform = function (chunk, encoding, done) {
            // var startTs = new Date();
            // console.log((new Date().getTime() - startTs.getTime()) + ": start");
            var feature = JSON.parse(chunk);
            // console.log("##### GJOT #####");
            // console.log("=== Before:")
            // console.log(feature);
            _this.geoJson.push(feature);
            // console.log("=== After:");
            // console.log(feature);
            done();
            // console.log((new Date().getTime() - startTs.getTime()) + ": finish");
        };
        t._flush = function (done) {
            try {
                console.log("#### start GJOT flush");
                var result = {
                    type: "FeatureCollection",
                    features: _this.geoJson
                };
                console.log("nFeatures: " + result.features.length);
                var strResult = JSON.stringify(result);
                // console.log(result);
                t.push(strResult);
                _this.geoJson = [];
                done();
            }
            catch (error) {
                console.log("#### GJOT flush error: " + error);
                done();
            }
        };
        return t;
    };
    return GeoJsonOutputTransformer;
})();
module.exports = GeoJsonOutputTransformer;
//# sourceMappingURL=GeoJsonOutputTransformer.js.map