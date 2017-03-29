"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var Winston = require("winston");
var request = require("request");
var moment = require("moment");
var path = require("path");
var fs = require("fs-extra");
var _ = require("underscore");
var GeoJSONHelper = require("../helpers/GeoJSON");
var Api = require("../api/ApiManager");
/** REST datasource
 *  Provides an endpoint for obtaining features from a REST source. The features can be provided in many forms,
 *  as they will be converted by a specific converter-JavaScript file. The converter takes care of the conversion
 *  from the format used by the REST source to GeoJSON.
 *  Furthermore the datasource will request the GeoJSON features on a certain interval. Only the features that have
 *  been updated in the interval period will be pushed to the client. Next to the polling interval, a prune period
 *  can be configured. When features have not been updated within the prune period, they will be deleted.
 */
var RestDataSource = (function () {
    function RestDataSource(server, apiManager, layerId, url) {
        if (url === void 0) { url = '/restdatasource'; }
        this.server = server;
        this.apiManager = apiManager;
        this.layerId = layerId;
        this.url = url;
        /** Features that should be added on the client */
        this.featuresUpdates = [];
        this.restDataSourceOpts = {};
        this.enableLogging = false;
        this.restDataSourceUrl = url;
        this.layerId = layerId;
    }
    RestDataSource.prototype.init = function (options, callback) {
        var _this = this;
        if (!options || !options.converterFile) {
            callback('Rest datasource not started: No converterfile provided.');
            return;
        }
        Winston.info('Init Rest datasource on port ' + this.server.get('port') + '. Base path is ' + this.url);
        this.counter = 1;
        this.restDataSourceOpts.converterFile = options.converterFile;
        this.restDataSourceOpts.url = options.url;
        this.restDataSourceOpts.urlParams = options.urlParams || {};
        this.restDataSourceOpts.pollIntervalSeconds = options.pollIntervalSeconds || 60;
        this.restDataSourceOpts.pruneIntervalSeconds = options.pruneIntervalSeconds || 300;
        this.restDataSourceOpts.diffIgnoreGeometry = (options.hasOwnProperty('diffIgnoreGeometry')) ? false : options['diffIgnoreGeometry'];
        this.restDataSourceOpts.diffPropertiesBlacklist = options.diffPropertiesBlacklist || [];
        this.restDataSourceOpts.diffPropertiesWhitelist = options.diffPropertiesWhitelist || [];
        this.restDataSourceOpts.dateProperty = options.dateProperty || '';
        this.restDataSourceOpts.timeProperty = options.timeProperty || '';
        this.restDataSourceOpts.dateFormat = options.dateFormat || '';
        this.restDataSourceOpts.timeFormat = options.timeFormat || '';
        this.restDataSourceOpts.maxFeatureAgeMinutes = options.maxFeatureAgeMinutes || Number.MAX_VALUE;
        this.restDataSourceOpts.logFile = options.logFile || null;
        if (this.restDataSourceOpts.diffPropertiesBlacklist.length > 0 && this.restDataSourceOpts.diffPropertiesWhitelist.length > 0) {
            Winston.info('Both whitelist and blacklist properties provided, ignoring the blacklist.');
            this.restDataSourceOpts.diffPropertiesBlacklist.length = 0;
        }
        if (!fs.existsSync(this.restDataSourceOpts.converterFile)) {
            callback("Provided converterfile not found. (" + this.restDataSourceOpts.converterFile + ")");
            return;
        }
        this.converter = require(this.restDataSourceOpts.converterFile);
        if (!this.isConverterValid()) {
            callback("Provided converterfile not valid. (" + path.basename(this.restDataSourceOpts.converterFile) + ")");
            return;
        }
        if (!!this.restDataSourceOpts.logFile) {
            fs.createFile(this.restDataSourceOpts.logFile, function (err) {
                if (!err) {
                    Winston.info('Log Rest data to ' + _this.restDataSourceOpts.logFile);
                    _this.enableLogging = true;
                }
                else {
                    Winston.warn('Error creating log ' + _this.restDataSourceOpts.logFile);
                    _this.enableLogging = false;
                }
            });
        }
        var urlDataParams = this.restDataSourceOpts.urlParams;
        urlDataParams['url'] = this.restDataSourceOpts.url;
        this.startRestPolling(urlDataParams);
        this.server.get(this.restDataSourceUrl, function (req, res) {
            Winston.info('Restdatasource got request');
            var layerDef = req.body;
            if (!layerDef || !_this.converter || !_this.features) {
                res.sendStatus(404);
                return;
            }
            layerDef.features = _.map(_this.features, function (val, key) { return val.f; });
            res.send(layerDef);
        });
        callback('Loaded successfully!');
    };
    RestDataSource.prototype.startRestPolling = function (dataParameters) {
        var _this = this;
        dataParameters['counter'] = this.counter++;
        this.converter.getData(request, dataParameters, { apiManager: this.apiManager, fs: fs }, function (result) {
            Winston.info('RestDataSource received ' + result.length || 0 + ' features');
            var featureCollection = GeoJSONHelper.GeoJSONFactory.Create(result);
            _this.filterOldEntries(featureCollection);
            if (!_this.features || Object.keys(_this.features).length === 0) {
                _this.initFeatures(featureCollection, Date.now());
            }
            else {
                _this.findFeatureDiff(featureCollection, Date.now());
            }
            if (_this.enableLogging) {
                var toWrite = 'Time: ' + (new Date()).toISOString() + '\n';
                toWrite += JSON.stringify(result, null, 2) + '\n';
                fs.appendFile(_this.restDataSourceOpts.logFile, toWrite, 'utf8', function (err) {
                    if (!err) {
                        Winston.debug('Logged REST datasource result');
                    }
                    else {
                        Winston.warn('Error while logging REST datasource result: ' + err);
                    }
                });
            }
        });
        setTimeout(function () { _this.startRestPolling(dataParameters); }, this.restDataSourceOpts.pollIntervalSeconds * 1000);
    };
    RestDataSource.prototype.filterOldEntries = function (fcoll) {
        if (!fcoll || !fcoll.features || fcoll.features.length === 0)
            return;
        console.log("Before filtering: " + fcoll.features.length);
        var dProp = this.restDataSourceOpts.dateProperty;
        var tProp = this.restDataSourceOpts.timeProperty;
        var dFormat = this.restDataSourceOpts.dateFormat;
        var tFormat = this.restDataSourceOpts.timeFormat;
        var age = this.restDataSourceOpts.maxFeatureAgeMinutes;
        fcoll.features = fcoll.features.filter(function (f) {
            if (f.properties.hasOwnProperty(dProp) && f.properties.hasOwnProperty(dProp)) {
                var time = f.properties[tProp].toString();
                if (time.length === 5)
                    time = '0' + time;
                var propDate = moment(''.concat(f.properties[dProp], time), ''.concat(dFormat, tFormat));
                var now = moment();
                if (Math.abs(now.diff(propDate, 'minutes', true)) > age) {
                    // console.log("Remove feature: " + propDate.toISOString());
                    return false;
                }
                else {
                    f.properties['ParsedDate'] = propDate.toDate().getTime();
                }
            }
            return true;
        });
        console.log("After filtering: " + fcoll.features.length);
    };
    RestDataSource.prototype.initFeatures = function (fCollection, updateTime) {
        var _this = this;
        if (!fCollection || !fCollection.features)
            return;
        if (!this.features)
            this.features = {};
        if (_.isArray(fCollection.features)) {
            fCollection.features.forEach(function (f, ind) {
                _this.features[f.id] = { f: f, updated: updateTime };
                if (ind === fCollection.features.length - 1) {
                    Winston.info('RestDataSource initialized ' + fCollection.features.length + ' features.');
                }
            });
        }
    };
    RestDataSource.prototype.findFeatureDiff = function (fCollection, updateTime) {
        var _this = this;
        if (!fCollection || !fCollection.features)
            return;
        this.featuresUpdates.length = 0;
        var notUpdated = 0, updated = 0, added = 0, removed = 0;
        var fts = fCollection.features;
        var fCollectionIds = [];
        if (_.isArray(fts)) {
            fts.forEach(function (f) {
                fCollectionIds.push(f.id);
                if (!_this.features.hasOwnProperty(f.id)) {
                    // ADD FEATURE
                    _this.features[f.id] = { f: f, updated: updateTime };
                    _this.featuresUpdates.push({ value: f, type: Api.ChangeType.Create, id: f.id });
                    added += 1;
                }
                else if (!_this.isFeatureUpdated(f)) {
                    // NO UPDATE
                    notUpdated += 1;
                }
                else {
                    // UPDATE
                    _this.features[f.id] = { f: f, updated: updateTime };
                    _this.featuresUpdates.push({ value: f, type: Api.ChangeType.Update, id: f.id });
                    updated += 1;
                }
            });
        }
        // CHECK INACTIVE FEATURES
        var inactiveFeatures = _.difference(Object.keys(this.features), fCollectionIds);
        if (inactiveFeatures && inactiveFeatures.length > 0) {
            inactiveFeatures.forEach(function (fId) {
                if ((updateTime - _this.features[fId].updated) >= (_this.restDataSourceOpts.pruneIntervalSeconds * 1000)) {
                    // REMOVE
                    _this.featuresUpdates.push({ value: _this.features[fId].f, type: Api.ChangeType.Delete, id: _this.features[fId].f.id });
                    delete _this.features[_this.features[fId].f.id];
                    removed += 1;
                }
            });
        }
        this.apiManager.addUpdateFeatureBatch(this.layerId, this.featuresUpdates, {}, function (r) { });
        Winston.info("Feature diff complete. " + updated + " updated \t" + added + " added \t" + notUpdated + " not updated \t" + removed + " removed. (" + this.counter + ")");
    };
    RestDataSource.prototype.isFeatureUpdated = function (f) {
        if (!f)
            return false;
        // Check geometry
        if (!this.restDataSourceOpts.diffIgnoreGeometry && !_.isEqual(f.geometry, this.features[f.id].f.geometry)) {
            return true;
        }
        if (!f.properties)
            return false;
        // Check for blacklisted properties
        if (this.restDataSourceOpts.diffPropertiesBlacklist.length > 0) {
            var blacklist = this.restDataSourceOpts.diffPropertiesBlacklist;
            if (_.isEqual(_.omit(f.properties, blacklist), _.omit(this.features[f.id].f.properties, blacklist))) {
                return false;
            }
        }
        // Check for whitelisted properties
        if (this.restDataSourceOpts.diffPropertiesWhitelist.length > 0) {
            var whitelist = this.restDataSourceOpts.diffPropertiesWhitelist;
            if (_.isEqual(_.pick(f.properties, whitelist), _.pick(this.features[f.id].f.properties, whitelist))) {
                return false;
            }
        }
        // Check all properties
        if (_.isEqual(f.properties, this.features[f.id].f.properties)) {
            return false;
        }
        return true;
    };
    RestDataSource.prototype.isConverterValid = function () {
        var valid = true;
        Winston.info("" + Object.keys(this.converter));
        valid = (this.converter.getData && typeof this.converter.getData === 'function');
        return valid;
    };
    return RestDataSource;
}());
exports.RestDataSource = RestDataSource;
//# sourceMappingURL=RestDataService.js.map