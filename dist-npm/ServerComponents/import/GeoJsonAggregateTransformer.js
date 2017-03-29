"use strict";
var Utils = require("../helpers/Utils");
var stream = require("stream");
var request = require("request");
var turf = require('turf');
var GeoJsonAggregateTransformer = (function () {
    function GeoJsonAggregateTransformer(title) {
        this.title = title;
        this.type = 'GeoJsonAggregateTransformer';
        this.id = Utils.newGuid();
        //this.description = description;
    }
    GeoJsonAggregateTransformer.prototype.initialize = function (opt, callback) {
        var _this = this;
        request({ url: 'http://localhost:3456/data/wijk-empty.geojson' }, function (error, response, body) {
            if (error) {
                callback(error);
                return;
            }
            console.log('Gemeente geojson loaded');
            _this.geometry = JSON.parse(body);
            callback(null);
        });
    };
    GeoJsonAggregateTransformer.prototype.create = function (config, opt) {
        var _this = this;
        var t = new stream.Transform();
        /*stream.Transform.call(t);*/
        var baseGeo;
        var accumulator = {};
        t.setEncoding('utf8');
        t._transform = function (chunk, encoding, done) {
            // var startTs = new Date();
            // console.log((new Date().getTime() - startTs.getTime()) + ": start");
            var feature = JSON.parse(chunk);
            if (!feature.geometry) {
                done();
                return;
            }
            // console.log("##### GJAT #####");
            // console.log("=== Before:")
            // console.log(feature);
            _this.geometry.features.forEach(function (f) {
                // console.log("=== Gemeente feature:")
                // console.log(f);
                // console.log("=== Piped feature:");
                // console.log(feature);
                if (turf.inside(feature, f)) {
                    // console.log(f);
                    // console.log(feature.properties.gemeentenaam + "<-- matched -->" + f.properties.wk_naam);
                    var accEntry = accumulator[f.properties.wk_code];
                    // console.log(accEntry);
                    if (accEntry) {
                        accEntry.sum++;
                    }
                    else {
                        accEntry = {
                            feature: f,
                            sum: 1
                        };
                        accumulator[f.properties.wk_code] = accEntry;
                    }
                }
            });
            // console.log("=== After:");
            // console.log(feature);
            //t.push(JSON.stringify(feature));
            done();
            // console.log((new Date().getTime() - startTs.getTime()) + ": finish");
        };
        t._flush = function (done) {
            try {
                console.log('#### start GJAT flush');
                for (var wijkCode in accumulator) {
                    var wijkAcc = accumulator[wijkCode];
                    console.log('#### push wijk');
                    console.log(wijkAcc);
                    wijkAcc.feature.properties.total = wijkAcc.sum;
                    t.push(JSON.stringify(wijkAcc.feature));
                }
                done();
            }
            catch (error) {
                done();
            }
        };
        return t;
    };
    return GeoJsonAggregateTransformer;
}());
module.exports = GeoJsonAggregateTransformer;
//# sourceMappingURL=GeoJsonAggregateTransformer.js.map