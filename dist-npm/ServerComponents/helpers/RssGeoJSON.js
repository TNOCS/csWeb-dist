"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Template for describing an RSS item, that contains coordinates, as GeoJSON.
 */
var RssGeoJSON = (function () {
    function RssGeoJSON() {
        this.type = "FeatureCollection";
        this.features = [];
    }
    return RssGeoJSON;
}());
exports.RssGeoJSON = RssGeoJSON;
var RssFeature = (function () {
    function RssFeature(lat, lon) {
        this.type = "Feature";
        this.properties = {};
        if (lat && lon) {
            this.geometry = {
                type: "Point",
                coordinates: [+lon, +lat]
            };
        }
    }
    return RssFeature;
}());
exports.RssFeature = RssFeature;
//# sourceMappingURL=RssGeoJSON.js.map