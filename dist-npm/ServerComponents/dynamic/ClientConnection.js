"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var io = require("socket.io");
var Winston = require("winston");
//GetDataSource: Function;
var MsgSubscription = /** @class */ (function () {
    function MsgSubscription() {
    }
    return MsgSubscription;
}());
exports.MsgSubscription = MsgSubscription;
var ProjectSubscription = /** @class */ (function () {
    function ProjectSubscription() {
    }
    return ProjectSubscription;
}());
exports.ProjectSubscription = ProjectSubscription;
var LayerSubscription = /** @class */ (function () {
    function LayerSubscription() {
    }
    return LayerSubscription;
}());
exports.LayerSubscription = LayerSubscription;
var KeySubscription = /** @class */ (function () {
    function KeySubscription() {
    }
    return KeySubscription;
}());
exports.KeySubscription = KeySubscription;
/**
 * object for sending project messages over socket.io channel
 */
var ProjectUpdate = /** @class */ (function () {
    function ProjectUpdate() {
    }
    return ProjectUpdate;
}());
exports.ProjectUpdate = ProjectUpdate;
/**
 * object for sending layer messages over socket.io channel
 */
var LayerUpdate = /** @class */ (function () {
    function LayerUpdate() {
    }
    return LayerUpdate;
}());
exports.LayerUpdate = LayerUpdate;
/**
 * object for sending layer messages over socket.io channel
 */
var KeyUpdate = /** @class */ (function () {
    function KeyUpdate() {
    }
    return KeyUpdate;
}());
exports.KeyUpdate = KeyUpdate;
/**
 * List of available action for sending/receiving project actions over socket.io channel
 */
var ProjectUpdateAction;
(function (ProjectUpdateAction) {
    ProjectUpdateAction[ProjectUpdateAction["updateProject"] = 0] = "updateProject";
    ProjectUpdateAction[ProjectUpdateAction["deleteProject"] = 1] = "deleteProject";
})(ProjectUpdateAction = exports.ProjectUpdateAction || (exports.ProjectUpdateAction = {}));
/**
 * List of available action for sending/receiving layer actions over socket.io channel
 */
var LayerUpdateAction;
(function (LayerUpdateAction) {
    LayerUpdateAction[LayerUpdateAction["updateFeature"] = 0] = "updateFeature";
    LayerUpdateAction[LayerUpdateAction["updateLog"] = 1] = "updateLog";
    LayerUpdateAction[LayerUpdateAction["deleteFeature"] = 2] = "deleteFeature";
    LayerUpdateAction[LayerUpdateAction["updateLayer"] = 3] = "updateLayer";
    LayerUpdateAction[LayerUpdateAction["deleteLayer"] = 4] = "deleteLayer";
    LayerUpdateAction[LayerUpdateAction["addUpdateFeatureBatch"] = 5] = "addUpdateFeatureBatch";
    LayerUpdateAction[LayerUpdateAction["deleteFeatureBatch"] = 6] = "deleteFeatureBatch";
})(LayerUpdateAction = exports.LayerUpdateAction || (exports.LayerUpdateAction = {}));
/**
 * List of available action for sending/receiving key actions over socket.io channel
 */
var KeyUpdateAction;
(function (KeyUpdateAction) {
    KeyUpdateAction[KeyUpdateAction["updateKey"] = 0] = "updateKey";
    KeyUpdateAction[KeyUpdateAction["deleteKey"] = 1] = "deleteKey"; // onlyused in imb api for now..
})(KeyUpdateAction = exports.KeyUpdateAction || (exports.KeyUpdateAction = {}));
var ClientMessage = /** @class */ (function () {
    function ClientMessage(action, data) {
        this.action = action;
        this.data = data;
    }
    return ClientMessage;
}());
exports.ClientMessage = ClientMessage;
var WebClient = /** @class */ (function () {
    function WebClient(Client) {
        this.Client = Client;
        this.Subscriptions = {};
    }
    WebClient.prototype.FindSubscription = function (target, type) {
        for (var k in this.Subscriptions) {
            if ((this.Subscriptions[k].type === "key" && type === "key" && this.Subscriptions[k].id === target)
                || (this.Subscriptions[k].regexPattern.test(target) && this.Subscriptions[k].type === type))
                return this.Subscriptions[k];
        }
        return null;
    };
    WebClient.prototype.Subscribe = function (sub) {
        var _this = this;
        sub.regexPattern = new RegExp(sub.target.replace(/\//g, "\\/").replace(/\./g, "\\."));
        this.Subscriptions[sub.id] = sub;
        this.Client.on(sub.id, function (data) {
            switch (data.action) {
                case "unsubscribe":
                    Winston.info('clientconnection: unsubscribed (' + sub.id + ")");
                    delete _this.Subscriptions[sub.id];
                    break;
            }
        });
        this.Client.emit(sub.id, new ClientMessage("subscribed", ""));
        Winston.info('clientconnection: subscribed to : ' + sub.target + " (" + sub.id + " : " + sub.type + ")");
    };
    return WebClient;
}());
exports.WebClient = WebClient;
var ConnectionManager = /** @class */ (function () {
    function ConnectionManager(httpServer) {
        var _this = this;
        this.users = {};
        //public subscriptions: LayerSubscription[] = [];
        this.msgSubscriptions = [];
        this.server = io(httpServer);
        this.server.on('connection', function (socket) {
            // store user
            Winston.warn('clientconnection: user ' + socket.id + ' has connected');
            var wc = new WebClient(socket);
            _this.users[socket.id] = wc;
            socket.on('disconnect', function (s) {
                delete _this.users[socket.id];
                Winston.info('clientconnection: user ' + socket.id + ' disconnected');
            });
            socket.on('subscribe', function (msg) {
                //Winston.error(JSON.stringify(msg));
                Winston.info('clientconnection: subscribe ' + JSON.stringify(msg.target) + " - " + socket.id);
                wc.Subscribe(msg);
                // wc.Client.emit('laag', 'test');
                //socket.emit('laag', 'test');
            });
            socket.on('msg', function (msg) {
                _this.checkClientMessage(msg, socket.id);
            });
            // socket.on('layer', (msg: LayerMessage) => {
            //     this.checkLayerMessage(msg, socket.id);
            // });
            // create layers room
            //var l = socket.join('layers');
            //l.on('join',(j) => {
            //    Winston.info("layers: "+ j);
            //});
        });
    }
    ConnectionManager.prototype.checkClientMessage = function (msg, client) {
        this.msgSubscriptions.forEach(function (sub) {
            if (sub.target === msg.action) {
                sub.callback(msg, client);
            }
        });
    };
    // public checkLayerMessage(msg: LayerMessage, client: string) {
    //     this.subscriptions.forEach((s: LayerSubscription) => {
    //         if (msg.layerId === s.layerId) {
    //             s.callback(LayerMessageAction[msg.action], msg, client);
    //         }
    //     });
    // }
    ConnectionManager.prototype.registerProject = function (projectId, callback) {
        var sub = new ProjectSubscription();
        sub.projectId = projectId;
        sub.callback = callback;
        //this.subscriptions.push(sub);
    };
    ConnectionManager.prototype.registerLayer = function (layerId, callback) {
        var sub = new LayerSubscription();
        sub.layerId = layerId;
        sub.callback = callback;
        //this.subscriptions.push(sub);
    };
    ConnectionManager.prototype.subscribe = function (on, callback) {
        var cs = new MsgSubscription();
        cs.target = on;
        cs.regexPattern = new RegExp(on.replace(/\//g, "\\/").replace(/\./g, "\\."));
        // var t = on.replace(/\//g, "\\/").replace(/\./g, "\\.");
        // var r = new RegExp(t);
        // var b1 = r.test('layer');
        // var r2 = new RegExp('kerel');
        // var b2 = r2.test('kerel');
        // var b3 = r2.test('kerel2');
        // var b4 = r2.test('kerel.sfsf');
        cs.callback = callback;
        this.msgSubscriptions.push(cs);
    };
    //
    // //Winston.info('updateSensorValue:' + sensor);
    // for (var uId in this.users) {
    //     //var sub = this.users[uId].FindSubscription(sensor,"sensor");
    //     for (var s in this.users[uId].Subscriptions) {
    //         var sub = this.users[uId].Subscriptions[s];
    //         if (sub.type == "sensor" && sub.target == sensor) {
    //             //Winston.info('sending update:' + sub.id);
    //             var cm = new ClientMessage("sensor-update", [{ sensor: sensor, date: date, value: value }]);
    //             //Winston.info(JSON.stringify(cm));
    //             this.users[uId].Client.emit(sub.id, cm);
    // }
    ConnectionManager.prototype.updateSensorValue = function (sensor, date, value) {
        //Winston.info('updateSensorValue:' + sensor);
        for (var uId in this.users) {
            //var sub = this.users[uId].FindSubscription(sensor,"sensor");
            for (var s in this.users[uId].Subscriptions) {
                var sub = this.users[uId].Subscriptions[s];
                if (sub.type == "sensor" && sub.target == sensor) {
                    //Winston.info('sending update:' + sub.id);
                    var cm = new ClientMessage("sensor-update", [{ sensor: sensor, date: date, value: value }]);
                    //Winston.info(JSON.stringify(cm));
                    this.users[uId].Client.emit(sub.id, cm);
                }
            }
        }
    };
    ConnectionManager.prototype.publish = function (key, type, command, object) {
        for (var uId in this.users) {
            var sub = this.users[uId].FindSubscription(key, type);
            if (sub != null) {
                Winston.info('sending update:' + sub.id);
                this.users[uId].Client.emit(sub.id, new ClientMessage(command, object));
            }
        }
    };
    ConnectionManager.prototype.updateDirectory = function (layer) {
    };
    /**
     * Send update to all clients.
     * @action: project-update
     * @meta: used to determine source/user, will skip
     */
    ConnectionManager.prototype.updateProject = function (projectId, update, meta) {
        //Winston.info('update feature ' + layer);
        var skip = (meta.source === "socketio") ? meta.user : undefined;
        for (var uId in this.users) {
            if (!skip || uId != skip) {
                var sub = this.users[uId].FindSubscription("", "directory");
                if (sub != null) {
                    //Winston.info('send to : ' + sub.id);
                    this.users[uId].Client.emit(sub.id, new ClientMessage("project", update));
                }
            }
        }
    };
    /**
     * Send update to all clients.
     * @action: logs-update, feature-update, feature-batch-update
     * @meta: used to determine source/user, will skip
     */
    ConnectionManager.prototype.updateFeature = function (layerId, update, meta) {
        //Winston.info('update feature ' + layer);
        var skip = (meta.source === "socketio") ? meta.user : undefined;
        for (var uId in this.users) {
            if (!skip || uId != skip) {
                var sub = this.users[uId].FindSubscription(layerId, "layer");
                if (sub != null) {
                    //Winston.info('send to : ' + sub.id);
                    this.users[uId].Client.emit(sub.id, new ClientMessage("layer", update));
                }
            }
        }
    };
    /**
     * Send update to all clients.
     * @action: logs-update, feature-update
     * @meta: used to determine source/user, will skip
     */
    ConnectionManager.prototype.updateLayer = function (layerId, update, meta) {
        //Winston.info('update feature ' + layer);
        var skip = (meta.source === "socketio") ? meta.user : undefined;
        for (var uId in this.users) {
            if (!skip || uId != skip) {
                var sub = this.users[uId].FindSubscription("", "directory");
                if (sub != null) {
                    //Winston.info('send to : ' + sub.id);
                    this.users[uId].Client.emit(sub.id, new ClientMessage("layer", update));
                }
            }
        }
    };
    /**
     * Send update to all clients.
     * @action: logs-update, feature-update
     * @meta: used to determine source/user, will skip
     */
    ConnectionManager.prototype.updateKey = function (keyId, update, meta) {
        //Winston.info('update feature ' + layer);
        var skip = (meta.source === "socketio") ? meta.user : undefined;
        for (var uId in this.users) {
            if (!skip || uId != skip) {
                var sub = this.users[uId].FindSubscription(keyId, "key");
                if (sub != null) {
                    //Winston.info('send to : ' + sub.id);
                    this.users[uId].Client.emit(sub.id, new ClientMessage("key", update));
                }
            }
        }
    };
    return ConnectionManager;
}());
exports.ConnectionManager = ConnectionManager;
//# sourceMappingURL=ClientConnection.js.map