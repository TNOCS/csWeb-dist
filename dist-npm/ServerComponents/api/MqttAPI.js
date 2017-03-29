"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var ApiManager = require("./ApiManager");
var ApiResult = ApiManager.ApiResult;
var mqtt = require("mqtt");
var mqttrouter = require("mqtt-router");
var BaseConnector = require("./BaseConnector");
var Winston = require("winston");
var MqttAPI = (function (_super) {
    __extends(MqttAPI, _super);
    function MqttAPI(server, port, layerPrefix, keyPrefix) {
        if (port === void 0) { port = 1883; }
        if (layerPrefix === void 0) { layerPrefix = "layers"; }
        if (keyPrefix === void 0) { keyPrefix = "keys"; }
        var _this = _super.call(this) || this;
        _this.server = server;
        _this.port = port;
        _this.layerPrefix = layerPrefix;
        _this.keyPrefix = keyPrefix;
        _this.isInterface = true;
        _this.receiveCopy = false;
        return _this;
    }
    MqttAPI.prototype.init = function (layerManager, options, callback) {
        var _this = this;
        this.manager = layerManager;
        this.layerPrefix = (this.manager.namespace + "/" + this.layerPrefix + "/").replace("//", "/");
        this.keyPrefix = (this.manager.namespace + "/" + this.keyPrefix + "/").replace("//", "/");
        Winston.info('mqtt: init mqtt connector on address ' + 'mqtt://' + this.server + ':' + this.port);
        this.client = mqtt.connect("mqtt://" + this.server + ":" + this.port);
        this.router = mqttrouter.wrap(this.client);
        this.client.on('error', function (e) {
            Winston.error("mqtt: error " + e);
        });
        this.client.on('connect', function () {
            Winston.debug("mqtt: connected");
            // server listens to all key updates
            if (!_this.manager.isClient) {
                var subscriptions = layerManager.options.mqttSubscriptions || '#';
                Winston.info("mqtt: listen to " + (subscriptions === '#' ? 'everything' : subscriptions));
                if (typeof subscriptions === 'string') {
                    _this.client.subscribe(subscriptions);
                }
                else {
                    subscriptions.forEach(function (s) { return _this.client.subscribe(s); });
                }
            }
        });
        this.client.on('reconnect', function () {
            Winston.debug("mqtt: reconnecting");
        });
        // TODO Use the router to handle messages
        // this.router.subscribe('hello/me/#:person', function(topic, message, params){
        //   console.log('received', topic, message, params);
        // });
        this.client.on('message', function (topic, message) {
            //Winston.info(`mqtt on message: ${topic}.`);
            //if (topic[topic.length - 1] === "/") topic = topic.substring(0, topic.length - 2);
            // listen to layer updates
            if (topic === _this.layerPrefix) {
                var layer = _this.extractLayer(message);
                if (layer && layer.id) {
                    Winston.info("mqtt: received definition for layer " + layer.id + " on topic " + topic);
                    Winston.debug("Definition: " + JSON.stringify(layer, null, 2));
                    _this.manager.addUpdateLayer(layer, { source: _this.id }, function () { });
                }
            }
            else if (topic.indexOf(_this.layerPrefix) === 0) {
                // We are either dealing with a layer update, or a feature update.
                // In the first case, the channel will be this.layerPrefix/layerId,
                // otherwise, it will be this.layerPrefix/layerId/feature/featureId.
                // So try to extract both. If there is only one, we are dealing a layer update.
                var ids = topic.substring(_this.layerPrefix.length, topic.length).split('/feature/');
                var layerId = ids[0];
                if (ids.length === 1) {
                    try {
                        var layer = _this.extractLayer(message);
                        if (layer) {
                            Winston.debug("mqtt: update layer " + layerId + " on topic " + topic);
                            _this.manager.addUpdateLayer(layer, { source: _this.id }, function () { });
                        }
                    }
                    catch (e) {
                        Winston.error("mqtt: error updating layer, exception " + e);
                    }
                }
                else {
                    try {
                        var featureId = ids[1];
                        var feature = JSON.parse(message);
                        if (feature) {
                            Winston.debug("mqtt: update feature " + featureId + " for layer " + layerId + " on topic " + topic + ".");
                            _this.manager.updateFeature(layerId, feature, { source: _this.id }, function () { });
                        }
                    }
                    catch (e) {
                        Winston.error("mqtt: error updating feature, exception " + e);
                    }
                }
            }
            else if (topic.indexOf(_this.keyPrefix) === 0) {
                var kid = topic.substring(_this.keyPrefix.length, topic.length).replace(/\//g, '.');
                if (kid) {
                    try {
                        var obj = JSON.parse(message);
                        //Winston.debug('mqtt: update key for id ' + kid + " : " + message);
                        _this.manager.updateKey(kid, obj, { source: _this.id }, function () { });
                    }
                    catch (e) {
                        Winston.error("mqtt: error updating key for id " + kid + ": " + message + ". Error " + e);
                    }
                }
            }
        });
        callback();
    };
    MqttAPI.prototype.extractLayer = function (message) {
        var layer = JSON.parse(message);
        // if you have a server, you don't need local storage
        if (layer.server)
            delete layer.storage;
        //if (!layer.server && layer.server === this.manager.options.server) return;
        return layer;
    };
    /**
     * Subscribe to certain keys using the internal MQTT router.
     * See also https://github.com/wolfeidau/mqtt-router.
     * @method subscribeKey
     * @param  {string}     keyPattern Pattern to listen for, e.g. hello/me/+:person listens for all hello/me/xxx topics.
     * @param  {ApiMeta}    meta       [description]
     * @param  {Function}   callback   Called when topic is called.
     * @return {[type]}                [description]
     */
    MqttAPI.prototype.subscribeKey = function (keyPattern, meta, callback) {
        Winston.info('subscribing key : ' + keyPattern);
        this.router.subscribe(keyPattern, function (topic, message, params) {
            callback(topic, message.toString(), params);
        });
    };
    MqttAPI.prototype.addLayer = function (layer, meta, callback) {
        this.updateLayer(layer, meta, callback);
    };
    MqttAPI.prototype.addFeature = function (layerId, feature, meta, callback) {
        if (meta.source !== this.id) {
            this.client.publish("" + this.layerPrefix + layerId + "/feature/" + feature.id, JSON.stringify(feature));
        }
        callback({ result: ApiResult.OK });
    };
    MqttAPI.prototype.updateLayer = function (layer, meta, callback) {
        Winston.info('mqtt: update layer ' + layer.id);
        if (meta.source !== this.id) {
            var def = this.manager.getLayerDefinition(layer);
            delete def.storage;
            // Send the layer definition to everyone
            this.client.publish(this.layerPrefix, JSON.stringify(def));
            // And place all the data only on the specific layer channel
            this.client.publish(this.layerPrefix + layer.id, JSON.stringify(layer));
        }
        callback({ result: ApiResult.OK });
    };
    MqttAPI.prototype.updateFeature = function (layerId, feature, useLog, meta, callback) {
        Winston.info('mqtt update feature');
        if (meta.source !== this.id)
            this.client.publish("" + this.layerPrefix + layerId + "/feature/" + feature.id, JSON.stringify(feature));
        callback({ result: ApiResult.OK });
    };
    MqttAPI.prototype.addUpdateFeatureBatch = function (layerId, features, useLog, meta, callback) {
        Winston.info('mqtt update feature batch');
        if (meta.source !== this.id) {
            this.client.publish("" + this.layerPrefix + layerId + "/featurebatch", JSON.stringify(features));
        }
        callback({ result: ApiResult.OK });
    };
    MqttAPI.prototype.sendFeature = function (layerId, featureId) {
        var _this = this;
        this.manager.findFeature(layerId, featureId, function (r) {
            if (r.result === ApiResult.OK) {
                _this.client.publish(_this.layerPrefix + layerId, JSON.stringify(r.feature));
            }
        });
    };
    MqttAPI.prototype.updateProperty = function (layerId, featureId, property, value, useLog, meta, callback) {
        this.sendFeature(layerId, featureId);
        callback({ result: ApiResult.OK });
    };
    MqttAPI.prototype.updateLogs = function (layerId, featureId, logs, meta, callback) {
        this.sendFeature(layerId, featureId);
        callback({ result: ApiResult.OK });
    };
    MqttAPI.prototype.initLayer = function (layer) {
        //this.client.subscribe(this.layerPrefix + layer.id + "/addFeature");
        Winston.info('mqtt: init layer ' + layer.id);
    };
    MqttAPI.prototype.getKeyChannel = function (keyId) {
        return this.keyPrefix + keyId.replace(/[\.]/g, "/");
    };
    MqttAPI.prototype.updateKey = function (keyId, value, meta, callback) {
        this.client.publish(this.getKeyChannel(keyId), JSON.stringify(value));
    };
    return MqttAPI;
}(BaseConnector.BaseConnector));
exports.MqttAPI = MqttAPI;
//# sourceMappingURL=MqttAPI.js.map