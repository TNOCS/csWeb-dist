"use strict";
/**
 *  Handle returned when subscribing to a topic
 */
var MessageBusHandle = (function () {
    function MessageBusHandle(topic, callback) {
        this.topic = topic;
        this.callback = callback;
    }
    return MessageBusHandle;
}());
exports.MessageBusHandle = MessageBusHandle;
/**
 * Simple message bus service, used for subscribing and unsubsubscribing to topics.
 * @see {@link https://gist.github.com/floatingmonkey/3384419}
 */
var MessageBusService = (function () {
    function MessageBusService() {
    }
    // constructor(public Connection: ClientConnection.ConnectionManager) {
    // }
    /**
     * Publish to a topic
     */
    MessageBusService.prototype.publish = function (topic, title, data) {
        //window.console.log("publish: " + topic + ", " + title);
        if (!MessageBusService.cache[topic]) {
            return;
        }
        MessageBusService.cache[topic].forEach(function (cb) { return cb(title, data); });
    };
    /**
     * Subscribe to a topic
     * @param {string} topic The desired topic of the message.
     * @param {IMessageBusCallback} callback The callback to call.
     */
    MessageBusService.prototype.subscribe = function (topic, callback) {
        if (!MessageBusService.cache[topic]) {
            MessageBusService.cache[topic] = new Array();
        }
        MessageBusService.cache[topic].push(callback);
        return new MessageBusHandle(topic, callback);
    };
    /**
     * Unsubscribe to a topic by providing its handle
     */
    MessageBusService.prototype.unsubscribe = function (handle) {
        var topic = handle.topic;
        var callback = handle.callback;
        if (!MessageBusService.cache[topic]) {
            return;
        }
        MessageBusService.cache[topic].forEach(function (cb, idx) {
            if (cb == callback) {
                MessageBusService.cache[topic].splice(idx, 1);
                return;
            }
        });
    };
    MessageBusService.cache = {};
    return MessageBusService;
}());
exports.MessageBusService = MessageBusService;
//# sourceMappingURL=MessageBus.js.map