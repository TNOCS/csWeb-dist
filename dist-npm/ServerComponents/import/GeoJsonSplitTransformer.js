"use strict";
var Utils = require("../helpers/Utils");
var stream = require("stream");
var request = require("request");
var turf = require('turf');
var GeoJsonSplitTransformer = (function () {
    function GeoJsonSplitTransformer(title) {
        this.title = title;
        this.type = 'GeoJsonSplitTransformer';
        this.id = Utils.newGuid();
        //this.description = description;
    }
    GeoJsonSplitTransformer.prototype.initialize = function (opt, callback) {
        /*console.log(JSON.stringify(opt,null,4));*/
        var _this = this;
        var splitShapeUrlParameter = opt.parameters.filter(function (p) { return p.type.title === 'splitShapeUrl'; })[0];
        if (!splitShapeUrlParameter) {
            callback('splitShapeUrl missing');
            return;
        }
        var keyPropertyParameter = opt.parameters.filter(function (p) { return p.type.title === 'splitShapeKeyProperty'; })[0];
        if (!keyPropertyParameter) {
            callback('splitShapeKeyProperty missing');
            return;
        }
        this.keyProperty = keyPropertyParameter.value;
        var identifierPropertyParameter = opt.parameters.filter(function (p) { return p.type.title === 'splitShapeIdentifierProperty'; })[0];
        if (!identifierPropertyParameter) {
            callback('splitShapeIdentifierProperty missing');
            return;
        }
        this.identifierProperty = identifierPropertyParameter.value;
        request({ url: splitShapeUrlParameter.value }, function (error, response, body) {
            if (error) {
                callback(error);
                return;
            }
            _this.geometry = JSON.parse(body);
            console.log('Split shape geojson loaded');
            callback(null);
        });
    };
    GeoJsonSplitTransformer.prototype.create = function (config, opt) {
        var _this = this;
        var t = new stream.Transform();
        /*stream.Transform.call(t);*/
        var baseGeo;
        var accumulator = {};
        t.setEncoding('utf8');
        var index = 0;
        t._transform = function (chunk, encoding, done) {
            /*var startTs = new Date();*/
            /*console.log((new Date().getTime() - startTs.getTime()) + ": start");*/
            /*console.log(index++);*/
            var feature = JSON.parse(chunk);
            if (!feature.geometry) {
                console.log('No geometry');
                done();
                return;
            }
            /*console.log("##### GJST #####");*/
            // console.log("=== Before:")
            // console.log(feature);
            _this.geometry.features.forEach(function (f) {
                // console.log("=== Gemeente feature:")
                // console.log(f);
                // console.log("=== Piped feature:");
                // console.log(feature);
                if (turf.inside(feature, f)) {
                    // console.log(feature.properties.Gemeente + "<-- matched -->" + f.properties.Name);
                    // feature.properties.wk_code = f.properties.wk_code;
                    // feature.properties.wk_naam = f.properties.wk_naam;
                    //feature.properties.Gemeente = f.properties.Name;
                    feature.properties[_this.identifierProperty] = f.properties[_this.keyProperty];
                    var accEntry = accumulator[f.properties[_this.keyProperty]];
                    if (accEntry) {
                        accEntry.push(feature);
                    }
                    else {
                        accEntry = [feature];
                        accumulator[f.properties[_this.keyProperty]] = accEntry;
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
                var keys = Object.keys(accumulator);
                /*console.log(JSON.stringify(keys));*/
                // for(var wijkCode in keys) {
                /*console.log(keys.length);*/
                keys.forEach(function (key) {
                    /*console.log(key);*/
                    var group = accumulator[key];
                    // console.log ("#### push wijk: " + wijkCode + " - " + wijkFeatures.length + " features");
                    // console.log(wijkAcc);
                    var groupGeoJson = {
                        type: 'FeatureCollection',
                        features: group
                    };
                    t.push(JSON.stringify(groupGeoJson));
                });
                done();
            }
            catch (error) {
                console.error(error);
                done();
            }
        };
        return t;
    };
    return GeoJsonSplitTransformer;
}());
module.exports = GeoJsonSplitTransformer;
//# sourceMappingURL=GeoJsonSplitTransformer.js.map