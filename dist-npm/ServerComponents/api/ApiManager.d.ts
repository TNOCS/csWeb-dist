import AuthApi = require('./AuthAPI');
import events = require('events');
/**
 * Api Result status
 */
export declare enum ApiResult {
    OK = 200,
    Error = 400,
    LayerAlreadyExists = 406,
    LayerNotFound = 407,
    FeatureNotFound = 408,
    ProjectAlreadyExists = 409,
    ProjectNotFound = 410,
    KeyNotFound = 411,
    GroupNotFound = 412,
    GroupAlreadyExists = 413,
    ResourceNotFound = 428,
    ResourceAlreadyExists = 429,
    SearchNotImplemented = 440,
}
export interface IApiManagerOptions {
    /** Host:port name */
    server?: string;
    /** Location of the simulation data */
    simDataFolder?: string;
    /** Specify what MQTT should subscribe to */
    mqttSubscriptions?: string[];
    [key: string]: any;
}
export interface ApiMeta {
    source?: string;
    user?: string;
}
/**
 * Default result object for api calls
 */
export declare class CallbackResult {
    result: ApiResult;
    error: any;
    project: Project;
    layer: Layer;
    groups: string[];
    feature: Feature;
    features: Feature[];
    resource: ResourceFile;
    keys: {
        [keyId: string]: Key;
    };
    key: Key;
}
/** Event emitted by the ApiManager */
export declare enum Event {
    KeyChanged = 0,
    PropertyChanged = 1,
    FeatureChanged = 2,
    LayerChanged = 3,
    ProjectChanged = 4,
    FeaturesChanged = 5,
}
/** Type of change in an ApiEvent */
export declare enum ChangeType {
    Create = 0,
    Update = 1,
    Delete = 2,
}
/** When a key|layer|project is changed, the ChangeEvent is emitted with the following data. */
export interface IChangeEvent {
    id: string;
    type: ChangeType;
    value?: Object;
}
export interface IConnector {
    id: string;
    isInterface: boolean;
    /** If true (default), the manager will send a copy to the source (receiving) connector */
    receiveCopy: boolean;
    init(layerManager: ApiManager, options: any, callback: Function): any;
    initLayer(layer: ILayer, meta?: ApiMeta): any;
    initProject(project: Project, meta?: ApiMeta): any;
    addLayer(layer: ILayer, meta: ApiMeta, callback: Function): any;
    getLayer(layerId: string, meta: ApiMeta, callback: Function): any;
    updateLayer(layer: ILayer, meta: ApiMeta, callback: Function): any;
    deleteLayer(layerId: string, meta: ApiMeta, callback: Function): any;
    searchLayer(layerId: string, keyWord: string, meta: ApiMeta, callback: Function): any;
    addFeature(layerId: string, feature: any, meta: ApiMeta, callback: Function): any;
    getFeature(layerId: string, featureId: string, meta: ApiMeta, callback: Function): any;
    updateFeature(layerId: string, feature: any, useLog: boolean, meta: ApiMeta, callback: Function): any;
    deleteFeature(layerId: string, featureId: string, meta: ApiMeta, callback: Function): any;
    addUpdateFeatureBatch(layerId: string, features: any[], useLog: boolean, meta: ApiMeta, callback: Function): any;
    addLog(layerId: string, featureId: string, property: string, log: Log, meta: ApiMeta, callback: Function): any;
    getLog(layerId: string, featureId: string, meta: ApiMeta, callback: Function): any;
    deleteLog(layerId: string, featureId: string, ts: number, prop: string, meta: ApiMeta, callback: Function): any;
    updateProperty(layerId: string, featureId: string, property: string, value: any, useLog: boolean, meta: ApiMeta, callback: Function): any;
    updateLogs(layerId: string, featureId: string, logs: {
        [key: string]: Log[];
    }, meta: ApiMeta, callback: Function): any;
    getBBox(layerId: string, southWest: number[], northEast: number[], meta: ApiMeta, callback: Function): any;
    getSphere(layerId: string, maxDistance: number, longtitude: number, latitude: number, meta: ApiMeta, callback: Function): any;
    getWithinPolygon(layerId: string, feature: Feature, meta: ApiMeta, callback: Function): any;
    addProject(project: Project, meta: ApiMeta, callback: Function): any;
    getProject(projectId: string, meta: ApiMeta, callback: Function): any;
    updateProject(project: Project, meta: ApiMeta, callback: Function): any;
    deleteProject(projectId: string, meta: ApiMeta, callback: Function): any;
    allGroups(projectId: string, meta: ApiMeta, callback: Function): any;
    /** Add a resource type file to the store. */
    addResource(reource: ResourceFile, meta: ApiMeta, callback: Function): any;
    /** Get a resource file  */
    getResource(resourceId: string, meta: ApiMeta, callback: Function): any;
    /** Add a file to the store, e.g. an icon or other media. */
    addFile(base64: string, folder: string, file: string, meta: ApiMeta, callback: Function): any;
    /** Get a specific key */
    getKey(keyId: string, meta: ApiMeta, callback: Function): any;
    /** Get a list of available keys */
    getKeys(meta: ApiMeta, callback: Function): any;
    /** Update the value for a given keyId */
    updateKey(keyId: string, value: Object, meta: ApiMeta, callback: Function): any;
    /** Delete key */
    deleteKey(keyId: string, meta: ApiMeta, callback: Function): any;
    /**
     * Subscribe to certain keys.
     * @method subscribeKey
     * @param  {string}     keyPattern Pattern to listen for, e.g. hello/me/+:person listens for all hello/me/xxx topics.
     * @param  {ApiMeta}    meta       [description]
     * @param  {Function}   callback   Called when topic is called.
     * @return {[type]}                [description]
     */
    subscribeKey(keyPattern: string, meta: ApiMeta, callback: (topic: string, message: string, params?: Object) => void): any;
}
export interface StorageObject {
    id: string;
    storage: string;
}
export declare class Key implements StorageObject {
    id: string;
    title: string;
    storage: string;
    values: Object[];
}
/**
 * Project definition
 */
export declare class Project implements StorageObject {
    id: string;
    title: string;
    url: string;
    _localFile: string;
    description: string;
    logo: string;
    storage: string;
    groups: Group[];
    isDynamic: boolean;
}
export declare class Group {
    id: string;
    title: string;
    description: string;
    clustering: boolean;
    clusterLevel: number;
    layers: Layer[];
}
export declare class ApiKeySubscription {
    id: string;
    /** Pattern you subscribe too */
    pattern: string;
    /** Regex safe variant of the pattern, i.e. the . is replaced with a \. */
    regexPattern: RegExp;
    callback: Function;
}
/**
 * Geojson ILayer definition
 */
export interface ILayer extends StorageObject {
    /** Server of the layer, needed for remote synchronization */
    server?: string;
    /**
     * id of storage connector
     */
    useLog?: boolean;
    updated?: number;
    enabled?: boolean;
    opacity?: number;
    id: string;
    type?: string;
    dynamic?: boolean;
    title?: string;
    image?: string;
    description?: string;
    url?: string;
    typeUrl?: string;
    defaultFeatureType?: string;
    defaultLegendProperty?: string;
    dynamicResource?: boolean;
    tags?: string[];
    isDynamic?: boolean;
    features?: Feature[];
    data?: any;
    timestamps?: number[];
    [key: string]: any;
    hasSensorData?: boolean;
}
/**
 * Geojson Layer definition
 */
export declare class Layer implements StorageObject, ILayer {
    /** Server of the layer, needed for remote synchronization */
    server: string;
    /**
     * id of storage connector
     */
    storage: string;
    useLog: boolean;
    updated: number;
    enabled: boolean;
    opacity: number;
    id: string;
    type: string;
    dynamic: boolean;
    title: string;
    image: string;
    description: string;
    url: string;
    typeUrl: string;
    defaultFeatureType: string;
    defaultLegendProperty: string;
    dynamicResource: boolean;
    tags: string[];
    isDynamic: boolean;
    features: Feature[];
    hasSensorData: boolean;
}
/**
 * Geojson ProjectId definition
 */
export declare class ProjectId {
    id: string;
}
/**
 * Geojson geometry definition
 */
export declare class Geometry {
    type: string;
    coordinates: any;
}
/**
 * Geojson feature definition
 */
export declare class Feature {
    type: string;
    id: string;
    geometry: Geometry;
    properties: {
        [key: string]: any;
    };
    logs: {
        [key: string]: Log[];
    };
    coordinates: any[];
    sensors: {
        [key: string]: any[];
    };
    timestamps: number[];
}
/**
 * Geojson IProperty definition
 */
export interface IProperty {
    [key: string]: any;
}
/**
 * Geojson property definition
 */
export declare class Property implements IProperty {
    [key: string]: any;
}
export declare class Log {
    ts: number;
    prop: string;
    value: any;
}
export declare class FeatureType {
}
export declare class PropertyType {
}
export declare class ResourceFile implements StorageObject {
    _localFile: string;
    featureTypes: {
        [key: string]: FeatureType;
    };
    propertyTypeData: {
        [key: string]: PropertyType;
    };
    id: string;
    title: string;
    storage: string;
}
/**
 * ApiManager, the main csWeb router that receives and sends layer/feature/keys updates around using
 * connectors and keeps all endpoints in sync.
 *
 * EMITS ApiEvents, which all return an IChangedEvent.
 * KeyChanged event when a key is changed (CRUD).
 * PropertyChanged event when a layer is changed (CRUD).
 * FeatureChanged event when a feature is changed (CRUD).
 * LayerChanged event when a layer is changed (CRUD).
 * ProjectChanged event when a project is changed (CRUD).
 * FeaturesChanged event when an array of features is changed (CRUD).
 */
export declare class ApiManager extends events.EventEmitter {
    isClient: boolean;
    options: IApiManagerOptions;
    /**
     * Dictionary of connectors (e.g. storage, interface, etc.)
     */
    connectors: {
        [key: string]: IConnector;
    };
    /**
     * Dictionary of resources
     */
    resources: {
        [key: string]: ResourceFile;
    };
    /**
     * Dictionary of layers (doesn't contain actual data)
     */
    layers: {
        [key: string]: ILayer;
    };
    /**
     * Dictionary of projects (doesn't contain actual data)
     */
    projects: {
        [key: string]: Project;
    };
    /**
     * Dictionary of sensor sets
     */
    keys: {
        [keyId: string]: Key;
    };
    keySubscriptions: {
        [id: string]: ApiKeySubscription;
    };
    defaultStorage: string;
    defaultLogging: boolean;
    rootPath: string;
    projectsFile: string;
    layersFile: string;
    /** The namespace is used for creating channels/layers/keys namespaces */
    namespace: string;
    /** The name is used to identify this instance, and should be unique in the federation */
    name: string;
    authService: AuthApi.AuthAPI;
    /** Create a new client, optionally specifying whether it should act as client. */
    constructor(namespace: string, name: string, isClient?: boolean, options?: IApiManagerOptions);
    init(rootPath: string, callback: Function): void;
    /** Sends a message (json) to a specific project, only works with socket io for now */
    sendClientMessage(project: string, message: Object): void;
    /** Open layer config file*/
    loadLayerConfig(cb: Function): void;
    /**
     * Open project config file
     */
    loadProjectConfig(cb: Function): void;
    /**
     * Have a 1 sec. delay before saving project config
     */
    saveProjectDelay: (project: Project) => void;
    /**
     * Have a 1 sec. delay before saving layer config
     */
    saveLayersDelay: (layer: ILayer) => void;
    /**
     * Store layer config file
     */
    saveProjectConfig(): void;
    /**
     * Store layer config file
     */
    saveLayerConfig(): void;
    /**
     * Look for available resources (from folder)
     */
    initResources(resourcesPath: string): void;
    /** Add a file to the store, e.g. an icon or other media. */
    addFile(base64: string, folder: string, file: string, meta: ApiMeta, callback: Function): void;
    /**
     * Update/add a resource and save it to file
     */
    addResource(resource: ResourceFile, replace: boolean, meta: ApiMeta, callback: Function): void;
    getResource(id: string, meta: ApiMeta, callback: Function): void;
    addLayerToProject(projectId: string, groupId: string, layerId: string, meta: ApiMeta, callback: Function): void;
    removeLayerFromProject(projectId: string, groupId: string, layerId: string, meta: ApiMeta, callback: Function): void;
    allGroups(projectId: string, meta: ApiMeta, callback: Function): void;
    addGroup(group: Group, projectId: string, meta: ApiMeta, callback: Function): void;
    updateGroup(projectId: string, groupId: string, newGroup: Group, meta: ApiMeta, callback: Function): void;
    removeGroup(groupId: string, projectId: string, meta: ApiMeta, callback: Function): void;
    addProject(project: Project, meta: ApiMeta, callback: Function): void;
    /**
     * Add connector to available connectors
     */
    addConnector(key: string, s: IConnector, options: any, callback?: Function): void;
    addConnectors(connectors: {
        key: string;
        s: IConnector;
        options: any;
    }[], callback: Function): void;
    /**
     * Find layer for a specific layerId (can return null)
     */
    findLayer(layerId: string): ILayer;
    /**
     * Find project for a specific projectId (can return null)
     */
    findProject(projectId: string): Project;
    /**
     * Find layer for a specific layerId (can return null)
     */
    findKey(keyId: string): Key;
    /**
     * find feature in a layer by featureid
     */
    findFeature(layerId: string, featureId: string, callback: Function): void;
    /**
     * Find storage for a layer
     */
    findStorage(object: StorageObject): IConnector;
    /**
     * Lookup layer and return storage engine for this layer
     */
    findStorageForLayerId(layerId: string): IConnector;
    /**
     * Lookup Project and return storage engine for this project
     */
    findStorageForProjectId(projectId: string): IConnector;
    /**
     * Lookup layer and return storage engine for this layer
     */
    findStorageForKeyId(keyId: string): IConnector;
    /**
     * Make sure the project has an unique project id
     */
    getProjectId(project: Project): string;
    /**
     * Returns project definition for a project
     */
    getProjectDefinition(project: Project): Project;
    /**
     * Returns project definition for a project
     */
    getGroupDefinition(group: Group): Group;
    /**
     * Returns layer definition for a layer, this is the layer without the features (mostly used for directory)
     */
    getLayerDefinition(layer: ILayer): ILayer;
    getProject(projectId: string, meta: ApiMeta, callback: Function): void;
    searchLayers(keyword: string, layerIds: string[], meta: ApiMeta, callback: Function): void;
    getLayer(layerId: string, meta: ApiMeta, callback: Function): void;
    /** Create a new layer, store it, and return it. */
    createLayer(layer: ILayer, meta: ApiMeta, callback: (result: CallbackResult) => void): void;
    addUpdateLayer(layer: ILayer, meta: ApiMeta, callback: Function): void;
    clearProject(projectId: string, meta: ApiMeta, callback: Function): void;
    updateProjectTitle(projectTitle: string, projectId: string, meta: ApiMeta, callback: Function): void;
    updateProject(project: Project, meta: ApiMeta, callback: Function): void;
    deleteLayer(layerId: string, meta: ApiMeta, callback: Function): void;
    deleteProject(projectId: string, meta: ApiMeta, callback: Function): void;
    getInterfaces(meta: ApiMeta): IConnector[];
    private setUpdateLayer(layer, meta);
    addFeature(layerId: string, feature: Feature, meta: ApiMeta, callback: Function): void;
    updateProperty(layerId: string, featureId: string, property: string, value: any, useLog: boolean, meta: ApiMeta, callback: Function): void;
    updateLogs(layerId: string, featureId: string, logs: {
        [key: string]: Log[];
    }, meta: ApiMeta, callback: Function): void;
    getFeature(layerId: string, featureId: string, meta: ApiMeta, callback: Function): void;
    updateFeature(layerId: string, feature: any, meta: ApiMeta, callback: Function): void;
    /** Similar to updateFeature, but with an array of updated features instead of one feature.
     *
     */
    addUpdateFeatureBatch(layerId: string, features: IChangeEvent[], meta: ApiMeta, callback: Function): void;
    deleteFeature(layerId: string, featureId: string, meta: ApiMeta, callback: Function): void;
    addLog(layerId: string, featureId: string, property: string, log: Log, meta: ApiMeta, callback: Function): void;
    initLayer(layer: Layer): void;
    initProject(project: Project): void;
    getLog(layerId: string, featureId: string, meta: ApiMeta, callback: Function): void;
    deleteLog(layerId: string, featureId: string, ts: number, prop: string, meta: ApiMeta, callback: Function): void;
    getBBox(layerId: string, southWest: number[], northEast: number[], meta: ApiMeta, callback: Function): void;
    getSphere(layerId: string, maxDistance: number, lng: number, lat: number, meta: ApiMeta, callback: Function): void;
    getWithinPolygon(layerId: string, feature: Feature, meta: ApiMeta, callback: Function): void;
    subscribeKey(pattern: string, meta: ApiMeta, callback: (topic: string, message: string, params?: Object) => void): ApiKeySubscription;
    addKey(key: Key, meta: ApiMeta, callback: Function): void;
    getKeys(meta: ApiMeta, callback: Function): void;
    getKey(id: string, meta: ApiMeta, callback: Function): void;
    updateKey(keyId: string, value: Object, meta?: ApiMeta, callback?: Function): void;
    /**
     * Register a callback which is being called before the process exits.
     * @method cleanup
     * @param  {Function} callback Callback function that performs the cleanup
     * See also: http://stackoverflow.com/questions/14031763/doing-a-cleanup-action-just-before-node-js-exits
     */
    cleanup(callback?: Function): void;
}
