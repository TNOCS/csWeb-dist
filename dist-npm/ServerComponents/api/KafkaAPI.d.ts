import ApiManager = require('./ApiManager');
import Layer = ApiManager.Layer;
import Log = ApiManager.Log;
import ApiMeta = ApiManager.ApiMeta;
import BaseConnector = require('./BaseConnector');
import kafka = require('kafka-node');
export declare enum KafkaCompression {
    NoCompression = 0,
    GZip = 1,
    snappy = 2,
}
export declare class KafkaOptions {
    consumers: string[] | Dictionary<number>;
    consumer: string;
    producers: string[];
}
export declare class KafkaAPI extends BaseConnector.BaseConnector {
    server: string;
    port: number;
    kafkaOptions: KafkaOptions;
    layerPrefix: string;
    keyPrefix: string;
    manager: ApiManager.ApiManager;
    consumer: string;
    private router;
    kafkaClient: kafka.Client;
    kafkaConsumer: kafka.Consumer;
    kafkaProducer: kafka.Producer;
    kafkaOffset: kafka.Offset;
    private xmlBuilder;
    private xmlParser;
    private producerReady;
    private offsetReady;
    private layersWaitingToBeSent;
    constructor(server: string, port: number, kafkaOptions: KafkaOptions, layerPrefix?: string, keyPrefix?: string);
    addProducer(topic: string): void;
    createTopics(topics: string[], tries?: number): void;
    /**
     *
     * Subscribe to the topic from the give offset. If no offset is defined, start listening from the latest offset.
     * @param {string} layer
     * @param {number} [fromOffset=-1]
     *
     * @memberOf KafkaAPI
    
     */
    subscribeLayer(layer: string, fromOffset?: number): void;
    private waitForOffsetToBeReady(cb);
    removeTopic(topic: string, cb: Function): void;
    exit(callback: Function): void;
    init(layerManager: ApiManager.ApiManager, options: any, callback: Function): void;
    private parseXmlMessage(msg, cb);
    /**
     *
     * Recursively search an object for the desired label and return that part of the object
     * @export
     * @param {Object} object to search
     * @param {string} label to find
     * @returns Object with the label, or null
     */
    private findObjectByLabel(object, label);
    private extractLayer(message);
    /**
     * Subscribe to certain keys using the internal MQTT router.
     * See also https://github.com/wolfeidau/mqtt-router.
     * @method subscribeKey
     * @param  {string}     keyPattern Pattern to listen for, e.g. hello/me/+:person listens for all hello/me/xxx topics.
     * @param  {ApiMeta}    meta       [description]
     * @param  {Function}   callback   Called when topic is called.
     * @return {[type]}                [description]
     */
    subscribeKey(keyPattern: string, meta: ApiMeta, callback: (topic: string, message: string, params?: Object) => void): void;
    addLayer(layer: Layer, meta: ApiMeta, callback: Function): void;
    addFeature(layerId: string, feature: any, meta: ApiMeta, callback: Function): void;
    updateLayer(layer: Layer, meta: ApiMeta, callback: Function): void;
    sendPayload(topic: string, buffer: Buffer, compression?: KafkaCompression, tries?: number): void;
    updateFeature(layerId: string, feature: any, useLog: boolean, meta: ApiMeta, callback: Function): void;
    addUpdateFeatureBatch(layerId: string, features: ApiManager.IChangeEvent[], useLog: boolean, meta: ApiMeta, callback: Function): void;
    private sendFeature(layerId, featureId);
    updateProperty(layerId: string, featureId: string, property: string, value: any, useLog: boolean, meta: ApiMeta, callback: Function): void;
    updateLogs(layerId: string, featureId: string, logs: {
        [key: string]: Log[];
    }, meta: ApiMeta, callback: Function): void;
    initLayer(layer: Layer): void;
    private getKeyChannel(keyId);
    updateKey(keyId: string, value: Object, meta: ApiMeta, callback: Function): void;
    setOffset(topic: string, offset: number): void;
    fetch(topic: string, time: number, cb: Function): void;
    /**
     * @param {string} topic
     * @param {Function} cb Calls back 'true' when topic exists.
     */
    topicExists(topic: string, cb: Function): void;
    fetchLatestOffsets(topic: string, cb: Function): void;
}
