"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var chokidar = require('chokidar');
var LayerDirectory;
(function (LayerDirectory_1) {
    var LayerDirectory = (function () {
        function LayerDirectory(server, connection) {
            this.server = server;
            this.connection = connection;
        }
        LayerDirectory.prototype.Start = function () {
            var _this = this;
            // setup http handler
            this.server.get("/layerDirectory/", function (req, res) { _this.GetDirectory(req, res); });
        };
        LayerDirectory.prototype.GetDirectory = function (req, res) {
            var result = {
                "id": "knmi",
                "reference": "knmi",
                "languages": {
                    "nl": {
                        "title": "KNMI Radar",
                        "description": "(Bron: KNMI)"
                    },
                    "en": {
                        "title": "KNMI Radar",
                        "description": "(Source: KNMI)"
                    }
                },
                "type": "wms",
                "wmsLayers": "RADNL_OPER_R___25PCPRR_L3_COLOR",
                "url": "http://geoservices.knmi.nl/cgi-bin/RADNL_OPER_R___25PCPRR_L3.cgi?",
                "enabled": false,
                "opacity": 50
            };
            res.send(result);
        };
        return LayerDirectory;
    }());
    LayerDirectory_1.LayerDirectory = LayerDirectory;
})(LayerDirectory = exports.LayerDirectory || (exports.LayerDirectory = {}));
//# sourceMappingURL=LayerDirectory.js.map