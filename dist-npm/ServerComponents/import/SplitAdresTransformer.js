"use strict";
var Utils = require("../helpers/Utils");
var stream = require("stream");
var SplitAdresTransformer = (function () {
    function SplitAdresTransformer(title) {
        this.title = title;
        this.type = "SplitAdresTransformer";
        this.id = Utils.newGuid();
        //this.description = description;
    }
    SplitAdresTransformer.prototype.initialize = function (opt, callback) {
        var zipcodeCityPropertyParameter = opt.parameters.filter(function (p) { return p.type.title == "zipcodeCityProperty"; })[0];
        if (zipcodeCityPropertyParameter) {
            this.zipcodeCityProperty = zipcodeCityPropertyParameter.value;
        }
        var streetHouseNumberPropertyParameter = opt.parameters.filter(function (p) { return p.type.title == "streetHouseNumberProperty"; })[0];
        if (streetHouseNumberPropertyParameter) {
            this.streetHouseNumberProperty = streetHouseNumberPropertyParameter.value;
        }
        callback(null);
    };
    SplitAdresTransformer.prototype.create = function (config, opt) {
        var _this = this;
        var t = new stream.Transform();
        /*stream.Transform.call(t);*/
        t.setEncoding("utf8");
        t._transform = function (chunk, encoding, done) {
            var feature = JSON.parse(chunk);
            // console.log("##### SAT #####");
            // console.log("=== Before:")
            // console.log(feature);
            if (_this.streetHouseNumberProperty) {
                var adres = feature.properties[_this.streetHouseNumberProperty];
                // console.log(this.streetHouseNumberProperty + ": " + adres);
                var street = adres.slice(0, adres.search(/\d/)).trim();
                var addressNumberWithAddition = adres.slice(adres.search(/\d/)).trim();
                var nonDigitIndex = addressNumberWithAddition.search(/\D/);
                if (nonDigitIndex == -1) {
                    nonDigitIndex = addressNumberWithAddition.length;
                }
                var strAddressNumber = addressNumberWithAddition.slice(0, nonDigitIndex).trim();
                var addressNumber = parseInt(strAddressNumber);
                feature.properties.straat = street;
                feature.properties.huisnummer = addressNumber;
                /*console.log(adres);
                console.log(street + " " + strAddressNumber);*/
                /*console.log(addressNumberWithAddition);*/
            }
            if (_this.zipcodeCityProperty) {
                var pc_plaats = feature.properties[_this.zipcodeCityProperty];
                var postcode = pc_plaats.slice(0, 7);
                feature.properties.postcode = postcode;
            }
            t.push(JSON.stringify(feature));
            // console.log("=== After:");
            // console.log(feature);
            done();
        };
        return t;
    };
    return SplitAdresTransformer;
}());
module.exports = SplitAdresTransformer;
//# sourceMappingURL=SplitAdresTransformer.js.map