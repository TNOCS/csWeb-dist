var Utils = require("../helpers/Utils");
var stream = require('stream');
var request = require("request");
var turf = require("turf");
var BushalteAggregateTransformer = (function () {
    function BushalteAggregateTransformer(title) {
        this.title = title;
        this.type = "BushalteAggregateTransformer";
        this.id = Utils.newGuid();
        //this.description = description;
    }
    BushalteAggregateTransformer.prototype.initialize = function (opt, callback) {
        var _this = this;
        var urlParameter = opt.parameters.filter(function (p) { return p.type.title == "aggregateShapeUrl"; })[0];
        if (!urlParameter) {
            callback("aggregateShapeUrl missing");
            return;
        }
        this.aggregateShapeUrl = urlParameter.value;
        var parameter = opt.parameters.filter(function (p) { return p.type.title == "aggregateShapeKeyProperty"; })[0];
        if (!parameter) {
            callback("aggregateShapeKeyProperty missing");
            return;
        }
        this.aggregateShapeKeyProperty = parameter.value;
        request({ url: urlParameter.value }, function (error, response, body) {
            if (error) {
                callback(error);
                return;
            }
            _this.geometry = JSON.parse(body);
            console.log("Geojson loaded: " + _this.geometry.features.length + " features");
            callback(null);
        });
    };
    BushalteAggregateTransformer.prototype.create = function (config, opt) {
        var _this = this;
        var t = new stream.Transform();
        /*stream.Transform.call(t);*/
        var baseGeo;
        var accumulator = {};
        var index = 0;
        t.setEncoding("utf8");
        t._transform = function (chunk, encoding, done) {
            var startTs = new Date();
            /*console.log((new Date().getTime() - startTs.getTime()) + ": start");*/
            /*console.log("##### GJAT #####");*/
            if (!_this.geometry) {
                console.log("No target geometry found");
                done();
                return;
            }
            var feature = JSON.parse(chunk);
            if (!feature.geometry) {
                index++;
                done();
                return;
            }
            // console.log("=== Before:")
            // console.log(feature);
            var found = false;
            _this.geometry.features.forEach(function (f) {
                if (found) {
                    return;
                }
                // console.log("=== Gemeente feature:")
                // console.log(f);
                // console.log("=== Piped feature:");
                // console.log(feature);
                /*console.log(feature.geometry);*/
                if (turf.inside(feature, f)) {
                    /*console.log(f);*/
                    // console.log(feature.properties.gemeentenaam + "<-- matched -->" + f.properties.wk_naam);
                    /*console.log(f.properties[this.aggregateShapeKeyProperty]);*/
                    var accEntry = accumulator[f.properties[_this.aggregateShapeKeyProperty]];
                    // console.log(accEntry);
                    if (accEntry) {
                        var currRoutes = parseInt(feature.properties["number_of_routes_at_stop"]);
                        if (accEntry["number_of_routes_at_stop_max"] < currRoutes) {
                            accEntry["number_of_routes_at_stop_max"] = currRoutes;
                        }
                        accEntry["number_of_routes_at_stop_total"] += currRoutes;
                        accEntry["number_of_routes_at_stop_count"]++;
                        var strRoutes = feature.properties["routes at stop"].toString(); // if a single route is a number it will be parsed as a number, we need routes as string
                        var routes = strRoutes.split(/;/g);
                        var accRoutes = accEntry["routes"];
                        /*console.log("before: " + accEntry["routes"]);*/
                        /*console.log("add " + routes);*/
                        routes.filter(function (value, index, arr) { return accRoutes.indexOf(value) < 0; }).forEach(function (r) { return accRoutes.push(r); });
                        /*console.log("after: " + accEntry["routes"]);*/
                        accEntry.nFeatures++;
                    }
                    else {
                        accEntry = {
                            feature: f,
                            nFeatures: 1
                        };
                        accEntry["number_of_routes_at_stop_max"] = parseInt(feature.properties["number_of_routes_at_stop"]);
                        accEntry["number_of_routes_at_stop_total"] = parseInt(feature.properties["number_of_routes_at_stop"]);
                        accEntry["number_of_routes_at_stop_count"] = 1;
                        var strRoutes = feature.properties["routes at stop"].toString();
                        var routes = strRoutes.split(/;/g);
                        accEntry["routes"] = routes;
                        accumulator[f.properties[_this.aggregateShapeKeyProperty]] = accEntry;
                    }
                    found = true;
                }
            });
            if (!found) {
                console.log("feature " + feature.properties.name + " could not be aggregated, town: " + feature.properties.town + ". " + feature.geometry.coordinates);
            }
            // console.log("=== After:");
            // console.log(feature);
            //t.push(JSON.stringify(feature));
            done();
            /*console.log((new Date().getTime() - startTs.getTime()) + ": finish " + index++);*/
        };
        t._flush = function (done) {
            try {
                /*console.log("#### start BAT flush");*/
                /*console.log(accumulator);*/
                for (var key in accumulator) {
                    var featureAcc = accumulator[key];
                    /*console.log ("#### push feature");*/
                    /*console.log(featureAcc);*/
                    featureAcc.feature.properties["routes"] = featureAcc["routes"].join(";");
                    featureAcc.feature.properties["routes_in_wijk"] = featureAcc["routes"].length;
                    featureAcc.feature.properties["bushaltes"] = featureAcc.nFeatures;
                    featureAcc.feature.properties["number_of_routes_at_stop_average"] = featureAcc["number_of_routes_at_stop_total"] / featureAcc["number_of_routes_at_stop_count"];
                    featureAcc.feature.properties["number_of_routes_at_stop_max"] = featureAcc["number_of_routes_at_stop_max"];
                    t.push(JSON.stringify(featureAcc.feature));
                }
                done();
            }
            catch (error) {
                done();
            }
        };
        return t;
    };
    return BushalteAggregateTransformer;
})();
module.exports = BushalteAggregateTransformer;
//# sourceMappingURL=BushalteAggregateTransformer.js.map