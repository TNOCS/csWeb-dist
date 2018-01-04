"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var request = require("request");
var _ = require("underscore");
var NominatimSource = /** @class */ (function () {
    function NominatimSource(config) {
        this.connectionString = 'http://nominatim.openstreetmap.org/search?';
        this.name = 'nominatim (openstreetmap)';
        if (config['osmUrl'])
            this.connectionString = config['osmUrl'];
    }
    NominatimSource.prototype.init = function () { };
    ;
    NominatimSource.prototype.searchAddress = function (query, limit, callback) {
        if (limit === void 0) { limit = 15; }
        var url = this.connectionString;
        var params = {
            q: query,
            format: 'json',
            addressdetails: 1,
            polygon: 0
        };
        url += _.reduce(params, function (memo, val, key) {
            return memo + key + '=' + val + '&';
        }, '');
        console.log("Find nominatim: " + url);
        request.get(url, function (error, response, body) {
            if (error || !response || response.statusCode !== 200) {
                console.log("Error in nominatim search: code " + (response ? response.statusCode : 'null') + "; " + error);
                callback(null);
                return;
            }
            if (body) {
                callback(JSON.parse(body));
            }
        });
    };
    NominatimSource.prototype.searchGemeente = function (query, limit, callback) {
        if (limit === void 0) { limit = 15; }
        console.log('Not implemented');
        callback(null);
        return;
    };
    return NominatimSource;
}());
exports.NominatimSource = NominatimSource;
//# sourceMappingURL=NominatimSource.js.map