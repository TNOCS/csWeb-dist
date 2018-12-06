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
var ApiResult = ApiManager.ApiResult;
var BaseConnector = require("./BaseConnector");
var Winston = require("winston");
var kafka = require("kafka-node");
var xml2js = require("xml2js");
var _ = require("underscore");
var MAX_TRIES_SEND = 5;
var KafkaCompression;
(function (KafkaCompression) {
    KafkaCompression[KafkaCompression["NoCompression"] = 0] = "NoCompression";
    KafkaCompression[KafkaCompression["GZip"] = 1] = "GZip";
    KafkaCompression[KafkaCompression["snappy"] = 2] = "snappy";
})(KafkaCompression = exports.KafkaCompression || (exports.KafkaCompression = {}));
var KafkaOptions = /** @class */ (function () {
    function KafkaOptions() {
    }
    return KafkaOptions;
}());
exports.KafkaOptions = KafkaOptions;
var KafkaAPI = /** @class */ (function (_super) {
    __extends(KafkaAPI, _super);
    function KafkaAPI(server, port, kafkaOptions, layerPrefix, keyPrefix) {
        if (port === void 0) { port = 8082; }
        if (layerPrefix === void 0) { layerPrefix = 'layers'; }
        if (keyPrefix === void 0) { keyPrefix = 'keys'; }
        var _this = _super.call(this) || this;
        _this.server = server;
        _this.port = port;
        _this.kafkaOptions = kafkaOptions;
        _this.layerPrefix = layerPrefix;
        _this.keyPrefix = keyPrefix;
        _this.producerReady = false;
        _this.offsetReady = false;
        _this.layersWaitingToBeSent = [];
        _this.isInterface = true;
        _this.receiveCopy = false;
        _this.consumer = kafkaOptions.consumer || 'csweb-consumer';
        _this.xmlBuilder = new xml2js.Builder({
            headless: false
        });
        _this.xmlParser = new xml2js.Parser({
            ignoreAttrs: true,
            explicitArray: false
        });
        return _this;
    }
    KafkaAPI.prototype.addProducer = function (topic) {
        if (!this.kafkaOptions.producers) {
            this.kafkaOptions.producers = [topic];
        }
        else if (!_.find(this.kafkaOptions.producers, topic)) {
            this.kafkaOptions.producers.push(topic);
        }
    };
    KafkaAPI.prototype.createTopics = function (topics, tries) {
        var _this = this;
        if (tries === void 0) { tries = 1; }
        if (!this.producerReady) {
            if (tries < MAX_TRIES_SEND) {
                Winston.warn("Kafka producer not ready to create topics! (" + tries + " / " + MAX_TRIES_SEND + ")");
                setTimeout(function () {
                    _this.createTopics(topics, tries + 1);
                }, 400);
            }
            else {
                Winston.warn("Kafka producer not ready to create topics! (" + tries + " / " + MAX_TRIES_SEND + "). Giving up.");
            }
        }
        else {
            this.kafkaProducer.createTopics(topics, true, function (err, data) {
                if (err) {
                    Winston.warn("Kafka: Error creating topics: " + err);
                }
                else {
                    Winston.info("Kafka: Created topics: " + data);
                }
            });
        }
    };
    /**
     *
     * Subscribe to the topic from the give offset. If no offset is defined, start listening from the latest offset.
     * @param {string} layer
     * @param {number} [fromOffset=-1]
     *
     * @memberOf KafkaAPI
    
     */
    KafkaAPI.prototype.subscribeLayer = function (layer, fromOffset) {
        var _this = this;
        if (fromOffset === void 0) { fromOffset = -1; }
        fromOffset = +fromOffset;
        Winston.info("Subscribe kafka layer : " + layer + " from " + (fromOffset >= 0 ? fromOffset : 'latest'));
        var topic = layer;
        this.waitForOffsetToBeReady(function (ready) {
            _this.fetchLatestOffsets(topic, function (latestOffset) {
                var offset = +latestOffset;
                if (fromOffset >= 0 && fromOffset <= +latestOffset) {
                    offset = fromOffset;
                }
                else if (fromOffset > +latestOffset) {
                    Winston.warn("Kafka warning: From offset " + fromOffset + " requested, but offset " + latestOffset + " is the latest available.");
                }
                _this.kafkaConsumer.addTopics([{
                        topic: topic,
                        encoding: 'utf8',
                        autoCommit: false,
                        offset: offset || 0
                    }], function (err, added) {
                    if (err) {
                        Winston.error("" + err);
                    }
                    else {
                        Winston.info("Kafka subscribed to topic " + topic + " from offset " + offset);
                    }
                }, true);
            });
        });
    };
    KafkaAPI.prototype.waitForOffsetToBeReady = function (cb) {
        var _this = this;
        if (!this.offsetReady) {
            setTimeout(function () {
                _this.waitForOffsetToBeReady(cb);
            }, 250);
        }
        else {
            cb(true);
        }
    };
    KafkaAPI.prototype.removeTopic = function (topic, cb) {
        this.kafkaConsumer.removeTopics([topic], function (err, removed) {
            if (err) {
                Winston.error("kafka: error removing topic " + topic + ": " + JSON.stringify(err));
                cb();
            }
            else {
                Winston.info("kafka: removed topic " + topic);
                cb(removed);
            }
        });
    };
    KafkaAPI.prototype.exit = function (callback) {
        Winston.info('Closing kafka connection');
        callback();
    };
    KafkaAPI.prototype.init = function (layerManager, options, callback) {
        var _this = this;
        this.manager = layerManager;
        this.layerPrefix = (this.manager.namespace + '-' + this.layerPrefix + '-').replace('//', '/');
        this.keyPrefix = (this.manager.namespace + '/' + this.keyPrefix + '/').replace('//', '/');
        Winston.info('kafka: init kafka connector on address ' + this.server + ':' + this.port);
        //this.kafka = new KafkaRest({ 'url': this.server + ':' + this.port });
        this.kafkaClient = new kafka.Client(this.server + ':' + this.port, this.consumer);
        this.kafkaConsumer = new kafka.Consumer(this.kafkaClient, [], {
            fetchMaxBytes: 5 * 1024 * 1024
        });
        this.kafkaProducer = new kafka.Producer(this.kafkaClient);
        this.kafkaOffset = new kafka.Offset(this.kafkaClient);
        this.kafkaOffset.on('ready', function (err) {
            _this.offsetReady = true;
            Winston.info("Kafka producer ready to send");
        });
        this.kafkaOffset.on('error', function (err) {
            Winston.error("Kafka error: " + JSON.stringify(err));
        });
        this.kafkaConsumer.on('message', function (message) {
            // scenarioUpdate or scenarioActivation message
            if (message.value && message.value.indexOf('<?xml') === 0) {
                var parsedMessage = _this.parseXmlMessage(message.value, function (scenarioMessage) {
                    if (scenarioMessage) {
                        _this.manager.updateKey(Object.keys(scenarioMessage).shift(), scenarioMessage, {
                            source: 'kafka'
                        }, function () { });
                    }
                });
                return;
            }
            var l;
            if (message.value && message.value.length > 0 && message.value[0] !== '{') {
                l = {
                    data: message.value,
                    type: 'grid'
                };
                // esri grid
            }
            else if (message.value === '') {
                // There is no update for this layer
                Winston.warn("No update for " + message.topic); // + message.value);
                _this.manager.sendClientMessage('pn1', "No update for " + message.topic);
            }
            else {
                try {
                    // geojson
                    l = JSON.parse(message.value);
                }
                catch (e) {
                    Winston.error('Error parsing kafka message: ' + e + ' ' + message.topic); // + message.value);
                    Winston.error(JSON.stringify(message.value, null, 2)); // + message.value);
                }
            }
            if (l) {
                l.id = message.topic;
                l.offset = message.offset;
                // l.quickRefresh = true;
                _this.manager.addUpdateLayer(l, {
                    source: _this.id
                }, function () { });
            }
        });
        this.kafkaConsumer.on('error', function (err) {
            Winston.error("Kafka error: " + JSON.stringify(err));
        });
        this.kafkaConsumer.on('offsetOutOfRange', function (err) {
            Winston.warn("Kafka offsetOutOfRange: " + JSON.stringify(err));
        });
        this.kafkaProducer.on('ready', function (err) {
            _this.producerReady = true;
            if (_this.layersWaitingToBeSent.length > 0) {
                _this.layersWaitingToBeSent.forEach(function (l) {
                    _this.updateLayer(l, {}, function () { });
                });
            }
            Winston.info("Kafka producer ready to send. Sent " + _this.layersWaitingToBeSent.length + " delayed layers");
            _this.layersWaitingToBeSent.length = 0; // clear array
        });
        this.kafkaProducer.on('error', function (err) {
            Winston.error("Kafka error: " + JSON.stringify(err));
        });
        var subscriptions = this.kafkaOptions.consumers || 'arnoud-test6';
        if (typeof subscriptions === 'string') {
            this.subscribeLayer(subscriptions);
            //this.client.subscribe(subscriptions);
        }
        else {
            _.each(subscriptions, function (val, key) {
                // subscription is either a string array or a Dictionary<number>:
                // case string array: val = topic, key = array index number
                // case Dictionary<number>: val = number, key = topic
                if (key && typeof key === 'string') {
                    _this.subscribeLayer(key, val);
                }
                else {
                    _this.subscribeLayer(val);
                }
            });
        }
        callback();
    };
    KafkaAPI.prototype.parseXmlMessage = function (msg, cb) {
        var _this = this;
        this.xmlParser.parseString(msg, function (err, parsedData) {
            if (err) {
                Winston.error(err);
                cb();
            }
            else {
                // Winston.info(JSON.stringify(parsedData, null, 2));
                var update = _this.findObjectByLabel(parsedData, 'scenarioUpdate');
                if (update) {
                    // Single element arrays in xml will be parsed to an object, so convert them back to an array manually.
                    if (update.scenarioUpdate.records && update.scenarioUpdate.records.record && !(update.scenarioUpdate.records.record.length)) {
                        update.scenarioUpdate.records.record = [update.scenarioUpdate.records.record];
                    }
                    cb(update);
                }
            }
        });
    };
    /**
     *
     * Recursively search an object for the desired label and return that part of the object
     * @export
     * @param {Object} object to search
     * @param {string} label to find
     * @returns Object with the label, or null
     */
    KafkaAPI.prototype.findObjectByLabel = function (object, label) {
        if (object.hasOwnProperty(label)) {
            return object;
        }
        for (var key in object) {
            if (object.hasOwnProperty(key) && (typeof object[key] === 'object')) {
                var foundLabel = this.findObjectByLabel(object[key], label);
                if (foundLabel) {
                    return foundLabel;
                }
            }
        }
        return null;
    };
    ;
    KafkaAPI.prototype.extractLayer = function (message) {
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
    KafkaAPI.prototype.subscribeKey = function (keyPattern, meta, callback) {
        Winston.info('subscribing key : ' + keyPattern);
        this.router.subscribe(keyPattern, function (topic, message, params) {
            callback(topic, message.toString(), params);
        });
    };
    KafkaAPI.prototype.addLayer = function (layer, meta, callback) {
        this.updateLayer(layer, meta, callback);
    };
    KafkaAPI.prototype.addFeature = function (layerId, feature, meta, callback) {
        if (meta.source !== this.id) {
            // this.client.publish(`${this.layerPrefix}${layerId}/feature/${feature.id}`, JSON.stringify(feature));
        }
        callback({
            result: ApiResult.OK
        });
    };
    KafkaAPI.prototype.updateLayer = function (layer, meta, callback) {
        if (!this.kafkaOptions.producers || this.kafkaOptions.producers.indexOf(layer.id) < 0) {
            Winston.warn("Add " + layer.id + " to the producers list");
            this.addProducer(layer.id);
        }
        if (meta.source !== this.id) {
            var def = this.manager.getLayerDefinition(layer);
            delete def.storage;
            layer.type = 'FeatureCollection';
            var buff = new Buffer(JSON.stringify(layer), 'utf-8');
            if (this.producerReady) {
                this.sendPayload(layer.id, buff, KafkaCompression.GZip);
                Winston.info("kafka: update layer " + layer.id);
            }
            else {
                Winston.info("kafka: update layer " + layer.id + " ('delayed')");
                this.layersWaitingToBeSent.push(layer);
            }
            // Send the layer definition to everyone
            //      this.client.publish(this.layerPrefix, JSON.stringify(def));
            // And place all the data only on the specific layer channel
            //     this.client.publish(this.layerPrefix + layer.id, JSON.stringify(layer));
        }
        callback({
            result: ApiResult.OK
        });
    };
    KafkaAPI.prototype.sendPayload = function (topic, buffer, compression, tries) {
        var _this = this;
        if (compression === void 0) { compression = KafkaCompression.GZip; }
        if (tries === void 0) { tries = 1; }
        var payloads = [{
                topic: topic,
                messages: buffer,
                attributes: compression
            }];
        if (this.producerReady) {
            this.kafkaProducer.send(payloads, function (err, data) {
                if (err) {
                    if (tries < MAX_TRIES_SEND) {
                        Winston.warn("Kafka failed to send: " + JSON.stringify(err) + " to " + topic + " (tries: " + tries + "/" + MAX_TRIES_SEND + "). Trying again...");
                        setTimeout(function () {
                            _this.sendPayload(topic, buffer, compression, tries + 1);
                        }, 500);
                    }
                    else {
                        Winston.error("Kafka error trying to send: " + JSON.stringify(err) + " (tries: " + tries + "/" + MAX_TRIES_SEND + ")");
                    }
                }
                else {
                    Winston.debug('Kafka sent message');
                }
            });
        }
        else {
            Winston.warn('Kafka producer not ready');
        }
    };
    KafkaAPI.prototype.updateFeature = function (layerId, feature, useLog, meta, callback) {
        var _this = this;
        Winston.info('kafka update feature');
        this.manager.getLayer(layerId, meta, function (r) {
            if (!r.error && r.layer) {
                _this.updateLayer(r.layer, meta, function (c) {
                    callback(c);
                });
            }
            else {
                callback({
                    result: ApiResult.LayerNotFound
                });
            }
        });
    };
    KafkaAPI.prototype.addUpdateFeatureBatch = function (layerId, features, useLog, meta, callback) {
        var _this = this;
        Winston.debug('kafka update feature batch');
        if (meta.source !== this.id) {
            this.manager.getLayer(layerId, meta, function (r) {
                if (!r.error && r.layer) {
                    _this.updateLayer(r.layer, meta, function (c) {
                        callback(c);
                    });
                }
                else {
                    callback({
                        result: ApiResult.LayerNotFound
                    });
                }
            });
        }
        callback({
            result: ApiResult.OK
        });
    };
    KafkaAPI.prototype.sendFeature = function (layerId, featureId) {
        this.manager.findFeature(layerId, featureId, function (r) {
            if (r.result === ApiResult.OK) {
                //          this.client.publish(this.layerPrefix + layerId, JSON.stringify(r.feature));
            }
        });
    };
    KafkaAPI.prototype.updateProperty = function (layerId, featureId, property, value, useLog, meta, callback) {
        this.sendFeature(layerId, featureId);
        callback({
            result: ApiResult.OK
        });
    };
    KafkaAPI.prototype.updateLogs = function (layerId, featureId, logs, meta, callback) {
        this.sendFeature(layerId, featureId);
        callback({
            result: ApiResult.OK
        });
    };
    KafkaAPI.prototype.initLayer = function (layer) {
        //this.client.subscribe(this.layerPrefix + layer.id + "/addFeature");
        // Winston.info('kafka: init layer ' + layer.id);
    };
    KafkaAPI.prototype.getKeyChannel = function (keyId) {
        return this.keyPrefix + keyId.replace(/[\.]/g, '/');
    };
    KafkaAPI.prototype.updateKey = function (keyId, value, meta, callback) {
        //       this.client.publish(this.getKeyChannel(keyId), JSON.stringify(value));
    };
    KafkaAPI.prototype.setOffset = function (topic, offset) {
        this.kafkaConsumer.setOffset(topic, 0, offset);
    };
    KafkaAPI.prototype.fetch = function (topic, time, cb) {
        var payload = {
            topic: topic,
            time: time,
            maxNum: 1
        };
        if (!this.offsetReady) {
            Winston.error("kafka: offset not ready");
            cb();
            return;
        }
        this.kafkaOffset.fetch([payload], function (err, offsets) {
            if (err) {
                Winston.error("kafka: error fetching: " + JSON.stringify(err));
                cb();
            }
            else {
                cb(offsets[topic][0]);
            }
        });
    };
    /**
     * @param {string} topic
     * @param {Function} cb Calls back 'true' when topic exists.
     */
    KafkaAPI.prototype.topicExists = function (topic, cb) {
        this.kafkaClient.topicExists([topic], function (notExisting) {
            if (notExisting && notExisting.topics && notExisting.topics.indexOf(topic) >= 0) {
                cb(false);
            }
            else {
                cb(true);
            }
        });
    };
    KafkaAPI.prototype.fetchLatestOffsets = function (topic, cb) {
        if (!this.offsetReady) {
            Winston.error("kafka: offset not ready");
            cb();
            return;
        }
        this.kafkaOffset.fetchLatestOffsets([topic], function (err, offsets) {
            if (err) {
                Winston.error("kafka: error fetching latest offsets: " + JSON.stringify(err));
                cb();
            }
            else {
                cb(offsets[topic][0]);
            }
        });
    };
    return KafkaAPI;
}(BaseConnector.BaseConnector));
exports.KafkaAPI = KafkaAPI;
//# sourceMappingURL=KafkaAPI.js.map