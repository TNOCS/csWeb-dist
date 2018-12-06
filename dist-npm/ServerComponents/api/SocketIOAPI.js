"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var ApiManager = require("./ApiManager");
var ClientConnection = require("./../dynamic/ClientConnection");
var ProjectUpdateAction = ClientConnection.ProjectUpdateAction;
var LayerUpdateAction = ClientConnection.LayerUpdateAction;
var KeyUpdateAction = ClientConnection.KeyUpdateAction;
var ApiResult = ApiManager.ApiResult;
var BaseConnector = require("./BaseConnector");
var Winston = require("winston");
var SocketIOAPI = /** @class */ (function (_super) {
    __extends(SocketIOAPI, _super);
    function SocketIOAPI(connection) {
        var _this = _super.call(this) || this;
        _this.connection = connection;
        _this.id = 'socketio';
        _this.isInterface = true;
        return _this;
    }
    SocketIOAPI.prototype.init = function (layerManager, options, callback) {
        var _this = this;
        this.manager = layerManager;
        Winston.info('socketio: init SocketIO API');
        this.connection.subscribe('layer', function (result, clientId) {
            var lu = result.data;
            if (lu) {
                ///TODO: check if lu.layerId really exists
                switch (lu.action) {
                    case ClientConnection.LayerUpdateAction.updateLog:
                        // find feature
                        var featureId = lu.item.featureId;
                        var logs = lu.item['logs'];
                        _this.manager.updateLogs(lu.layerId, featureId, logs, { source: _this.id, user: clientId }, function () { });
                        break;
                    case ClientConnection.LayerUpdateAction.updateFeature:
                        var ft = lu.item;
                        _this.manager.updateFeature(lu.layerId, ft, { source: _this.id, user: clientId }, function (r) { });
                        break;
                    case ClientConnection.LayerUpdateAction.deleteFeature:
                        _this.manager.deleteFeature(lu.layerId, lu.item, { source: _this.id, user: clientId }, function (r) { });
                        break;
                    case ClientConnection.LayerUpdateAction.addUpdateFeatureBatch:
                        _this.manager.addUpdateFeatureBatch(lu.layerId, lu.item, { source: _this.id, user: clientId }, function (r) { });
                        break;
                    case ClientConnection.LayerUpdateAction.deleteFeatureBatch:
                        _this.manager.deleteFeatureBatch(lu.layerId, lu.item, false, { source: _this.id, user: clientId }, function (r) { });
                        break;
                }
            }
        });
        this.connection.subscribe('project', function (result, clientId) {
            var lu = result.data;
            if (lu) {
                ///TODO: check if lu.layerId really exists
                switch (lu.action) {
                    case ClientConnection.ProjectUpdateAction.updateProject:
                        var p = JSON.parse(lu.item);
                        _this.manager.updateProject(p, { source: _this.id, user: clientId }, function (r) { });
                        break;
                    case ClientConnection.ProjectUpdateAction.deleteProject:
                        _this.manager.deleteProject(lu.projectId, { source: _this.id, user: clientId }, function (r) { });
                        break;
                }
            }
            //result.data
        });
        this.connection.subscribe('key', function (result, clientId) {
            var lu = result.data;
            if (lu) {
                ///TODO: check if lu.layerId really exists
                switch (lu.action) {
                    case ClientConnection.KeyUpdateAction.updateKey:
                        // find feature
                        var keyId = lu.item.keyId;
                        _this.manager.updateKey(lu.keyId, lu.item, { source: _this.id, user: clientId }, function () { });
                        break;
                }
            }
            //result.data
        });
        callback();
    };
    /** Sends a message (json) to a specific project, only works with socket io for now */
    SocketIOAPI.prototype.sendClientMessage = function (project, message) {
        this.connection.publish(project, 'layer', 'msg', message);
    };
    SocketIOAPI.prototype.addLayer = function (layer, meta, callback) {
        //this.connection.publish();
        var lu = { layerId: layer.id, action: LayerUpdateAction.updateLayer, item: layer };
        this.connection.updateLayer(layer.id, lu, meta);
        callback({ result: ApiResult.OK });
    };
    SocketIOAPI.prototype.updateLayer = function (layer, meta, callback) {
        var lu = { layerId: layer.id, action: LayerUpdateAction.updateLayer, item: layer };
        this.connection.updateLayer(layer.id, lu, meta);
        callback({ result: ApiResult.OK });
    };
    SocketIOAPI.prototype.deleteLayer = function (layerId, meta, callback) {
        var lu = { layerId: layerId, action: LayerUpdateAction.deleteLayer };
        this.connection.updateLayer(layerId, lu, meta);
        callback({ result: ApiResult.OK });
    };
    SocketIOAPI.prototype.initLayer = function (layer) {
        Winston.info('socketio: init layer ' + layer.id);
        this.connection.registerLayer(layer.id, function (action, msg, client) {
            Winston.debug('socketio: action:' + action);
        });
    };
    SocketIOAPI.prototype.addProject = function (project, meta, callback) {
        //this.connection.publish();
        var lu = { projectId: project.id, action: ProjectUpdateAction.updateProject, item: project };
        this.connection.updateProject(project.id, lu, meta);
        callback({ result: ApiResult.OK });
    };
    SocketIOAPI.prototype.updateProject = function (project, meta, callback) {
        var lu = { projectId: project.id, action: ProjectUpdateAction.updateProject, item: project };
        this.connection.updateProject(project.id, lu, meta);
        callback({ result: ApiResult.OK });
    };
    SocketIOAPI.prototype.deleteProject = function (projectId, meta, callback) {
        var lu = { projectId: projectId, action: ProjectUpdateAction.deleteProject };
        this.connection.updateProject(projectId, lu, meta);
        callback({ result: ApiResult.OK });
    };
    SocketIOAPI.prototype.initProject = function (project) {
        Winston.info('socketio: init project ' + project.id);
        this.connection.registerProject(project.id, function (action, msg, client) {
            Winston.debug('socketio: action:' + action);
        });
    };
    SocketIOAPI.prototype.addFeature = function (layerId, feature, meta, callback) {
        var lu = { layerId: layerId, action: LayerUpdateAction.updateFeature, item: feature };
        this.connection.updateFeature(layerId, lu, meta);
        callback({ result: ApiResult.OK });
    };
    SocketIOAPI.prototype.updateFeature = function (layerId, feature, useLog, meta, callback) {
        Winston.info('socketio: update feature');
        var lu = { layerId: layerId, featureId: feature.id, action: LayerUpdateAction.updateFeature, item: feature };
        this.connection.updateFeature(layerId, lu, meta);
        callback({ result: ApiResult.OK });
    };
    SocketIOAPI.prototype.addUpdateFeatureBatch = function (layerId, features, useLog, meta, callback) {
        Winston.info('socketio: update feature batch');
        var lu = { layerId: layerId, featureId: null, action: LayerUpdateAction.addUpdateFeatureBatch, item: features };
        this.connection.updateFeature(layerId, lu, meta);
        callback({ result: ApiResult.OK });
    };
    SocketIOAPI.prototype.updateLogs = function (layerId, featureId, logs, meta, callback) {
        Winston.info('socketio: update logs ' + JSON.stringify(logs));
        var lu = { layerId: layerId, action: LayerUpdateAction.updateLog, item: logs, featureId: featureId };
        this.connection.updateFeature(layerId, lu, meta);
        callback({ result: ApiResult.OK });
    };
    SocketIOAPI.prototype.deleteFeatureBatch = function (layerId, featureIds, useLog, meta, callback) {
        var _this = this;
        featureIds.forEach(function (fid) {
            var lu = { layerId: layerId, action: LayerUpdateAction.deleteFeature, featureId: fid };
            _this.connection.updateFeature(layerId, lu, meta);
        });
        callback({ result: ApiResult.OK });
    };
    SocketIOAPI.prototype.deleteFeature = function (layerId, featureId, meta, callback) {
        var lu = { layerId: layerId, action: LayerUpdateAction.deleteFeature, featureId: featureId };
        this.connection.updateFeature(layerId, lu, meta);
        callback({ result: ApiResult.OK });
    };
    SocketIOAPI.prototype.updateKey = function (keyId, value, meta, callback) {
        var ku = { keyId: keyId, action: KeyUpdateAction.updateKey, item: value };
        this.connection.updateKey(keyId, ku, meta);
        callback({ result: ApiResult.OK });
    };
    return SocketIOAPI;
}(BaseConnector.BaseConnector));
exports.SocketIOAPI = SocketIOAPI;
//# sourceMappingURL=SocketIOAPI.js.map