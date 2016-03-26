"use strict";
var Utils = require("../helpers/Utils");
var stream = require('stream');
var turf = require("turf");
var FieldFilterTransformer = (function () {
    function FieldFilterTransformer(title) {
        this.title = title;
        this.type = "FieldFilterTransformer";
        this.id = Utils.newGuid();
        //this.description = description;
    }
    FieldFilterTransformer.prototype.initialize = function (opt, callback) {
        var filterPropertyParameter = opt.parameters.filter(function (p) { return p.type.title == "property"; })[0];
        if (!filterPropertyParameter) {
            callback("property missing");
            return;
        }
        this.filterProperty = filterPropertyParameter.value;
        var filterValueParameter = opt.parameters.filter(function (p) { return p.type.title == "value"; })[0];
        if (!filterValueParameter) {
            /*console.log("value missing");*/
            callback("value missing");
            return;
        }
        if (typeof filterValueParameter.value === "string") {
            var strValue = filterValueParameter.value;
            try {
                var regExp = new RegExp(strValue);
                this.filterValue = regExp;
            }
            catch (error) {
                callback("Error parsing regex: " + strValue);
                return;
            }
        }
        else if (typeof filterValueParameter.value === "number") {
            this.filterValue = filterValueParameter.value;
            console.log(strValue + ": number");
        }
        callback(null);
    };
    FieldFilterTransformer.prototype.create = function (config, opt) {
        var _this = this;
        var t = new stream.Transform();
        /*stream.Transform.call(t);*/
        var baseGeo;
        t.setEncoding("utf8");
        t._transform = function (chunk, encoding, done) {
            // var startTs = new Date();
            // console.log((new Date().getTime() - startTs.getTime()) + ": start");
            var feature = JSON.parse(chunk);
            // console.log(this.filterProperty + "  - " + this.filterValue);
            if (_this.filterValue instanceof RegExp) {
                if (feature.properties[_this.filterProperty].match(_this.filterValue)) {
                    // console.log(feature.properties[this.filterProperty] + " matches " + this.filterValue + " regex.")
                    t.push(JSON.stringify(feature));
                }
                else {
                }
            }
            else if (_this.filterValue instanceof Number) {
                if (feature.properties[_this.filterProperty] == _this.filterValue) {
                    // console.log(feature.properties[this.filterProperty] + " matches " + this.filterValue + " numerical.")
                    t.push(JSON.stringify(feature));
                }
                else {
                }
            }
            // console.log(feature);
            // var gemeentecode = feature.properties.gemeentecode;
            // if (feature.properties.HoofdactiviteitenCode.match(/^(86|87|88)/) && (pcNr > 1000 && pcNr < 1099)) { // Zorg Amsterdam
            // if (feature.properties.HoofdactiviteitenCode.match(/^(86|87|88)/) && (pcNr > 3500 && pcNr < 3585)) { // Zorg Utrecht
            // if (feature.properties.HoofdactiviteitenCode.match(/^(86|87|88)/) && (gemeentecode == "0344")) { // Zorg Utrecht
            // if (feature.properties.HoofdactiviteitenCode.match(/^(85)/) && (pcNr > 1000 && pcNr < 1099)) { // Onderwijs Amsterdam
            // if (feature.properties.HoofdactiviteitenCode.match(/^(85)/) && (pcNr > 3500 && pcNr < 3585)) { // Onderwijs Utrecht
            // if (feature.properties.HoofdactiviteitenCode.match(/^(90|91)/) && (pcNr > 1000 && pcNr < 1099)) { // Cultuur Amsterdam
            // if (feature.properties.HoofdactiviteitenCode.match(/^(90|91)/) && (pcNr > 3500 && pcNr < 3585)) { // Cultuur Utrecht
            // if (feature.properties.HoofdactiviteitenCode.match(/^(93)/) && (pcNr > 1000 && pcNr < 1099)) { // Sport en Recreatie Amsterdam
            // if (feature.properties.HoofdactiviteitenCode.match(/^(93)/) && (pcNr > 3500 && pcNr < 3585)) { // Sporten Recreatie Utrecht
            // if (feature.properties.HoofdactiviteitenCode.match(/^(86|87|88)/) ) { // NL
            // t.push(JSON.stringify(feature));
            // }
            /*
                  if (pcNr > 3500 && pcNr < 3585) {
                    t.push(JSON.stringify(feature));
                  }
            */
            // console.log("=== After:");
            // console.log(feature);
            done();
            // console.log((new Date().getTime() - startTs.getTime()) + ": finish");
        };
        return t;
    };
    return FieldFilterTransformer;
}());
module.exports = FieldFilterTransformer;
//# sourceMappingURL=FieldFilterTransformer.js.map