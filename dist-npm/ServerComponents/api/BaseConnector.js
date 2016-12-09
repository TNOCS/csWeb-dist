"use strict";
var ApiManager = require('./ApiManager');
var ApiResult = ApiManager.ApiResult;
var BaseConnector = (function () {
    function BaseConnector() {
        this.receiveCopy = true;
    }
    BaseConnector.prototype.initLayer = function (layer) {
    };
    // layer methods first, in crud order.
    BaseConnector.prototype.addLayer = function (layer, meta, callback) {
    };
    BaseConnector.prototype.getLayer = function (layerId, meta, callback) {
    };
    BaseConnector.prototype.updateLayer = function (layer, meta, callback) {
    };
    BaseConnector.prototype.deleteLayer = function (layerId, meta, callback) {
    };
    BaseConnector.prototype.searchLayer = function (layerId, keyWord, meta, callback) {
        callback({ result: ApiResult.SearchNotImplemented });
    };
    BaseConnector.prototype.addLayerToProject = function (layerId, meta, callback) {
    };
    BaseConnector.prototype.removeLayerFromProject = function (layerId, meta, callback) {
    };
    BaseConnector.prototype.allGroups = function (projectId, meta, callback) {
    };
    BaseConnector.prototype.addGroup = function (group, projectId, meta, callback) {
    };
    BaseConnector.prototype.removeGroup = function (groupId, projectId, meta, callback) {
    };
    // feature methods, in crud order
    BaseConnector.prototype.addFeature = function (layerId, feature, meta, callback) {
    };
    //TODO: implement
    BaseConnector.prototype.getFeature = function (layerId, i, meta, callback) {
    };
    //TODO: implement
    BaseConnector.prototype.updateFeature = function (layerId, feature, useLog, meta, callback) {
    };
    //TODO: implement
    BaseConnector.prototype.addUpdateFeatureBatch = function (layerId, feature, useLog, meta, callback) {
    };
    //TODO: test further. Result is the # of deleted docs.
    BaseConnector.prototype.deleteFeature = function (layerId, featureId, meta, callback) {
    };
    BaseConnector.prototype.updateProperty = function (layerId, featureId, property, value, useLog, meta, callback) {
    };
    // public addLog(layerId: string, featureId: string, property: any, callback: Function) {
    //
    // }
    BaseConnector.prototype.updateLogs = function (layerId, featureId, logs, meta, callback) {
    };
    BaseConnector.prototype.addLog = function (layerId, featureId, property, log, meta, callback) {
    };
    BaseConnector.prototype.getLog = function (layerId, featureId, meta, callback) {
    };
    BaseConnector.prototype.deleteLog = function (layerId, featureId, ts, prop, meta, callback) {
    };
    BaseConnector.prototype.getBBox = function (layerId, southWest, northEast, meta, callback) {
    };
    BaseConnector.prototype.getSphere = function (layerId, maxDistance, longtitude, latitude, meta, callback) {
    };
    BaseConnector.prototype.getWithinPolygon = function (layerId, feature, meta, callback) {
    };
    BaseConnector.prototype.initProject = function (project) {
    };
    BaseConnector.prototype.addProject = function (project, meta, callback) {
    };
    BaseConnector.prototype.getProject = function (projectId, meta, callback) {
    };
    BaseConnector.prototype.updateProject = function (project, meta, callback) {
    };
    BaseConnector.prototype.deleteProject = function (projectId, meta, callback) {
    };
    BaseConnector.prototype.addFile = function (base64, folder, file, meta, callback) {
    };
    BaseConnector.prototype.addResource = function (resource, meta, callback) {
    };
    /** Get a resource file  */
    BaseConnector.prototype.getResource = function (resourceId, meta, callback) {
    };
    /** Get a specific key */
    BaseConnector.prototype.getKey = function (keyId, meta, callback) { };
    /** Get a list of available keys */
    BaseConnector.prototype.getKeys = function (meta, callback) { };
    /** Update the value for a given keyId */
    BaseConnector.prototype.updateKey = function (keyId, value, meta, callback) { };
    /** Delete key */
    BaseConnector.prototype.deleteKey = function (keyId, meta, callback) { };
    //TODO: Move connection set-up params from static to parameterized.
    BaseConnector.prototype.init = function (layerManager, options, callback) {
    };
    BaseConnector.prototype.exit = function (callback) {
        callback();
    };
    /**
     * Subscribe to certain keys.
     * @method subscribeKey
     * @param  {string}     keyPattern Pattern to listen for, e.g. hello/me/+:person listens for all hello/me/xxx topics.
     * @param  {ApiMeta}    meta       [description]
     * @param  {Function}   callback   Called when topic is called.
     * @return {[type]}                [description]
     */
    BaseConnector.prototype.subscribeKey = function (keyPattern, meta, callback) { };
    return BaseConnector;
}());
exports.BaseConnector = BaseConnector;
//# sourceMappingURL=BaseConnector.js.map