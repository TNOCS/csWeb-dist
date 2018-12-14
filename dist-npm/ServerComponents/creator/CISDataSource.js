"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var Winston = require("winston");
var BodyParser = require("body-parser");
var request = require("request");
var xml2js = require("xml2js");
var _ = require("underscore");
var Utils = require("../helpers/Utils");
/** CIS datasource
 *  Provides an endpoint for obtaining and sending CIS messages
 */
var CISDataSource = (function () {
    function CISDataSource(server, apiManager, capLayerId, url) {
        if (url === void 0) { url = '/cis'; }
        this.server = server;
        this.apiManager = apiManager;
        this.capLayerId = capLayerId;
        this.url = url;
        this.cisOptions = {};
        this.xmlBuilder = new xml2js.Builder({ headless: true });
        this.xmlParser = new xml2js.Parser({ ignoreAttrs: true, explicitArray: false });
    }
    CISDataSource.prototype.init = function (options, callback) {
        var _this = this;
        if (!options) {
            callback('CIS datasource not started: No options provided.');
            return;
        }
        this.cisOptions.sendMessageUrl = [this.url, options.sendMessageUrl || 'notify'].join('/').replace('//', '/');
        this.cisOptions.cisMsgReceivedUrl = [this.url, options.cisMsgReceivedUrl || 'CISMsgReceived'].join('/').replace('//', '/');
        this.cisOptions.cisNotifyUrl = options.cisNotifyUrl || '';
        Winston.info('Init CIS datasource listening on port ' + this.server.get('port') + ' with endpoint ' + this.cisOptions.sendMessageUrl);
        this.server.post(this.cisOptions.sendMessageUrl, function (req, res) {
            Winston.info('Notify the CIS datasource on ' + _this.cisOptions.cisNotifyUrl);
            res.sendStatus(200);
            var feature = req.body;
            var props = (feature.properties) ? feature.properties : {};
            var cisMsg = CISDataSource.createDefaultCISMessage();
            // Transform flat properties to CAP alert structure
            Object.keys(props).forEach(function (key) {
                if (cisMsg.msg.hasOwnProperty(key)) {
                    if (key === 'sender') {
                        cisMsg.msg[key] = "csweb";
                    }
                    else if (key === "sent") {
                        cisMsg.msg[key] = CISDataSource.convertDateToCAPDate(new Date());
                    }
                    else {
                        cisMsg.msg[key] = props[key];
                    }
                }
                if (cisMsg.msg.hasOwnProperty('info') && cisMsg.msg['info'].hasOwnProperty(key)) {
                    cisMsg.msg['info'][key] = props[key];
                }
                if (cisMsg.msg.hasOwnProperty('info') && cisMsg.msg['info'].hasOwnProperty('area') && cisMsg.msg['info']['area'].hasOwnProperty(key)) {
                    cisMsg.msg['info']['area'][key] = props[key];
                }
            });
            // Add geometry
            if (cisMsg.msg.hasOwnProperty('info') && cisMsg.msg['info'].hasOwnProperty('area')) {
                // Fake a Point-feature to be a Polygon for now, as it is better supported by the other teams.
                if (feature.geometry.type.toLowerCase() === 'point') {
                    var coords = feature.geometry.coordinates;
                    var polCoords = [[
                            [coords[0] - 0.05, coords[1] + 0.05],
                            [coords[0] - 0.05, coords[1] - 0.05],
                            [coords[0] + 0.05, coords[1] - 0.05],
                            [coords[0] + 0.05, coords[1] + 0.05],
                            [coords[0] - 0.05, coords[1] + 0.05]
                        ]];
                    feature.geometry.type = 'Polygon';
                    feature.geometry.coordinates = polCoords;
                }
                var keyVal = CISDataSource.convertGeoJSONToCAPGeometry(feature.geometry, 20);
                cisMsg.msg['info']['area'][keyVal.key] = keyVal.val;
            }
            // Parse JSON to xml
            var xmlMsg = _this.xmlBuilder.buildObject(cisMsg.msg);
            xmlMsg = xmlMsg.replace('<root>', '<alert xmlns="urn:oasis:names:tc:emergency:cap:1.2">').replace('</root>', '</alert>');
            cisMsg.msg = xmlMsg;
            Winston.info(xmlMsg);
            request.post({
                url: _this.cisOptions.cisNotifyUrl,
                json: cisMsg
            }, function (err, response, data) {
                if (!err && response && response.statusCode && response.statusCode == 200) {
                    Winston.info('Notified the CIS datasource');
                }
                else {
                    Winston.info('Error in notifying the CIS datasource: ' + err);
                }
            });
        });
        this.server.post(this.cisOptions.cisMsgReceivedUrl, BodyParser.text(), function (req, res) {
            Winston.info('CISMsg received');
            Winston.debug(req.body);
            _this.parseCisMessage(req.body, function (result) {
                if (result) {
                    _this.convertCapFeature(result);
                }
            });
            res.sendStatus(200);
        });
        callback('CIS datasource loaded successfully!');
    };
    CISDataSource.prototype.parseCisMessage = function (msg, cb) {
        if (!msg) {
            Winston.info('No xml-string found');
            cb();
            return;
        }
        this.xmlParser.parseString(msg, function (err, cap) {
            if (err) {
                Winston.error(err);
                cb();
            }
            else {
                Winston.info(JSON.stringify(cap, null, 2));
                cb(cap);
            }
        });
    };
    CISDataSource.prototype.convertCapFeature = function (cap) {
        Winston.info('Convert CAP to a feature');
        var f = {
            type: "Feature",
            id: Utils.newGuid(),
            properties: {},
            geometry: null
        };
        f.properties = CISDataSource.flattenObject(cap, {});
        Winston.info(JSON.stringify(f.properties, null, 2));
        if (f.properties.hasOwnProperty('polygon')) {
            f.geometry = CISDataSource.convertCAPGeometryToGeoJSON(f.properties['polygon'], 'polygon');
        }
        else if (f.properties.hasOwnProperty('circle')) {
            f.geometry = CISDataSource.convertCAPGeometryToGeoJSON(f.properties['circle'], 'circle');
        }
        else {
            Winston.error('No valid CAP geometry found.');
            return;
        }
        f.properties['featureTypeId'] = "Alert";
        //Ignore messages from csWeb (as our own messages get returned)
        if (f.properties['sender'] && f.properties['sender'].toLowerCase() === 'csweb') {
            console.log('Ignoring CAP message coming from csWeb');
        }
        else {
            this.apiManager.addFeature(this.capLayerId, f, {}, function () { });
        }
    };
    /**
     * Flattens a nested object to a flat dictionary.
     * Example:
     * { X: 1, Y: {Ya: 2, Yb: 3}}
     *       }
     * }
     * to {X: 1, Ya: 2, Yb: 3}
     */
    CISDataSource.flattenObject = function (nest, flat, key) {
        if (key === void 0) { key = 'unknown'; }
        if (_.isObject(nest)) {
            _.each(nest, function (v, k) {
                CISDataSource.flattenObject(v, flat, k);
            });
        }
        else {
            flat[key] = nest;
        }
        return flat;
    };
    CISDataSource.createDefaultCISMessage = function () {
        var deParams = {
            id: 'csweb-' + Utils.newGuid(),
            senderId: 'someone@csweb',
            dateTimeSent: CISDataSource.convertDateToCAPDate(new Date()),
            kind: 'Report',
            status: 'Excercise'
        };
        var alertMsg = {
            identifier: deParams.id,
            sender: 'CSWEB',
            sent: CISDataSource.convertDateToCAPDate(new Date()),
            status: 'Test',
            msgType: 'Alert',
            scope: 'Public',
            addresses: '',
            info: {
                category: 'Met',
                event: 'Monitor',
                urgency: 'Immediate',
                severity: 'Severe',
                certainty: 'Observed',
                headline: 'Headline',
                area: {
                    areaDesc: 'Testarea'
                }
            }
        };
        var cisMessage = {
            msgType: "CAP",
            msg: alertMsg,
            deParameters: deParams
        };
        return cisMessage;
    };
    /**
     * Takes a date object, outputs a CAP date string
     */
    CISDataSource.convertDateToCAPDate = function (date) {
        if (!date)
            return;
        var tdiff = date.getTimezoneOffset();
        var tdiffh = Math.floor(Math.abs(tdiff / 60));
        var tdiffm = tdiff % 60;
        var tdiffpm = (tdiff <= 0) ? '-' : '+';
        var iso = date.toISOString().split('.').shift();
        iso = ''.concat(iso, tdiffpm, (tdiffh < 10) ? '0' : '', tdiffh.toFixed(0), ':', (tdiffm < 10) ? '0' : '', tdiffm.toFixed(0));
        Winston.info("Converted date to " + iso);
        return iso;
    };
    /**
     * Takes a a GeoJSON Polygon or Point {type, coordinates: [[y,x],[y,x]]} (WGS84)
     * Outputs a CAP Polygon in the format: "x,y x,y x,y" or Circle in the format "x,y r" (r in km)
     * Optionally provide a circle radius in km, in case a point is provided (default: 10km)
     */
    CISDataSource.convertGeoJSONToCAPGeometry = function (geo, radiusKM) {
        if (radiusKM === void 0) { radiusKM = 10; }
        if (!geo || !geo.type || !geo.coordinates)
            return;
        var capCoords = '';
        var coords = geo.coordinates;
        if (geo.type.toLowerCase() === 'polygon') {
            for (var i = 0; i < coords[0].length; i++) {
                var cc = coords[0][i];
                capCoords += cc[1] + ',' + cc[0] + ' ';
            }
            capCoords = capCoords.substr(0, capCoords.length - 1); //Remove last space
        }
        else if (geo.type.toLowerCase() === 'point') {
            capCoords = coords[1] + ',' + coords[0] + ' ' + radiusKM;
        }
        else {
            Winston.warn('Could not convert GeoJSON geometry to CAP');
        }
        Winston.info("Converted " + JSON.stringify(geo) + " to " + capCoords);
        var type = (geo.type.toLowerCase() === 'polygon') ? 'polygon' : 'circle';
        return { key: type, val: capCoords };
    };
    /**
     * Takes a CAP Polygon in the format: "x,y x,y x,y". (WGS84)
     * Outputs a GeoJSON geometry {type, coordinates: [[y,x],[y,x]]}.
     */
    CISDataSource.convertCAPGeometryToGeoJSON = function (cisPoly, cisType) {
        if (!cisPoly)
            return;
        var result;
        var cisCoords = cisPoly.split(' ');
        if (cisType === 'polygon') {
            result = { type: "Polygon", coordinates: [[]] };
            for (var i = 0; i < cisCoords.length; i++) {
                var cc = cisCoords[i];
                var xy = cc.split(',');
                result.coordinates[0].push([+xy[1], +xy[0]]);
            }
        }
        else if (cisType === 'circle') {
            var xy = cisCoords[0].split(' ').shift().split(',');
            result = { type: "Point", coordinates: [+xy[1], +xy[0]] };
        }
        else {
            Winston.warn('Could not convert CAP geometry');
        }
        Winston.info("Converted " + cisPoly + " to " + JSON.stringify(result));
        return result;
    };
    return CISDataSource;
}());
exports.CISDataSource = CISDataSource;
//# sourceMappingURL=CISDataSource.js.map