import MessageBus = require("../bus/MessageBus");
import ApiManager = require('../api/ApiManager');
import ApiMeta = ApiManager.ApiMeta;
export declare class MsgSubscription {
    id: string;
    type: string;
    target: string;
    regexPattern: RegExp;
    callback: Function;
}
export declare class ProjectSubscription {
    projectId: string;
    callback: MessageBus.IMessageBusCallback;
}
export declare class LayerSubscription {
    layerId: string;
    callback: MessageBus.IMessageBusCallback;
}
export declare class KeySubscription {
    keyId: string;
    callback: MessageBus.IMessageBusCallback;
}
/**
 * object for sending project messages over socket.io channel
 */
export declare class ProjectUpdate {
    projectId: string;
    action: ProjectUpdateAction;
    item: any;
}
/**
 * object for sending layer messages over socket.io channel
 */
export declare class LayerUpdate {
    layerId: string;
    action: LayerUpdateAction;
    item: any;
    featureId: string;
}
/**
 * object for sending layer messages over socket.io channel
 */
export declare class KeyUpdate {
    keyId: string;
    action: KeyUpdateAction;
    item: any;
}
/**
 * List of available action for sending/receiving project actions over socket.io channel
 */
export declare enum ProjectUpdateAction {
    updateProject = 0,
    deleteProject = 1,
}
/**
 * List of available action for sending/receiving layer actions over socket.io channel
 */
export declare enum LayerUpdateAction {
    updateFeature = 0,
    updateLog = 1,
    deleteFeature = 2,
    updateLayer = 3,
    deleteLayer = 4,
    addUpdateFeatureBatch = 5,
    deleteFeatureBatch = 6,
}
/**
 * List of available action for sending/receiving key actions over socket.io channel
 */
export declare enum KeyUpdateAction {
    updateKey = 0,
    deleteKey = 1,
}
export declare class ClientMessage {
    action: string;
    data: any;
    constructor(action: string, data: any);
}
export declare class WebClient {
    Client: any;
    Name: string;
    Subscriptions: {
        [key: string]: MsgSubscription;
    };
    constructor(Client: any);
    FindSubscription(target: string, type: string): MsgSubscription;
    Subscribe(sub: MsgSubscription): void;
}
export declare class ConnectionManager {
    private users;
    server: SocketIO.Server;
    msgSubscriptions: MsgSubscription[];
    constructor(httpServer: any);
    checkClientMessage(msg: ClientMessage, client: string): void;
    registerProject(projectId: string, callback: MessageBus.IMessageBusCallback): void;
    registerLayer(layerId: string, callback: MessageBus.IMessageBusCallback): void;
    subscribe(on: string, callback: Function): void;
    updateSensorValue(sensor: string, date: number, value: number): void;
    publish(key: string, type: string, command: string, object: any): void;
    updateDirectory(layer: string): void;
    /**
     * Send update to all clients.
     * @action: project-update
     * @meta: used to determine source/user, will skip
     */
    updateProject(projectId: string, update: ProjectUpdate, meta: ApiMeta): void;
    /**
     * Send update to all clients.
     * @action: logs-update, feature-update, feature-batch-update
     * @meta: used to determine source/user, will skip
     */
    updateFeature(layerId: string, update: LayerUpdate, meta: ApiMeta): void;
    /**
     * Send update to all clients.
     * @action: logs-update, feature-update
     * @meta: used to determine source/user, will skip
     */
    updateLayer(layerId: string, update: LayerUpdate, meta: ApiMeta): void;
    /**
     * Send update to all clients.
     * @action: logs-update, feature-update
     * @meta: used to determine source/user, will skip
     */
    updateKey(keyId: string, update: KeyUpdate, meta: ApiMeta): void;
}
