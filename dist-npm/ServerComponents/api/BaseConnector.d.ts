import ApiManager = require('./ApiManager');
import Project = ApiManager.Project;
import Group = ApiManager.Group;
import Layer = ApiManager.Layer;
import Feature = ApiManager.Feature;
import Log = ApiManager.Log;
import ApiMeta = ApiManager.ApiMeta;
export declare class BaseConnector implements ApiManager.IConnector {
    manager: ApiManager.ApiManager;
    id: string;
    isInterface: boolean;
    receiveCopy: boolean;
    initLayer(layer: Layer): void;
    addLayer(layer: Layer, meta: ApiMeta, callback: Function): void;
    getLayer(layerId: string, meta: ApiMeta, callback: Function): void;
    updateLayer(layer: Layer, meta: ApiMeta, callback: Function): void;
    deleteLayer(layerId: string, meta: ApiMeta, callback: Function): void;
    searchLayer(layerId: string, keyWord: string, meta: ApiMeta, callback: Function): void;
    addLayerToProject(layerId: string, meta: ApiMeta, callback: Function): void;
    removeLayerFromProject(layerId: string, meta: ApiMeta, callback: Function): void;
    allGroups(projectId: string, meta: ApiMeta, callback: Function): void;
    addGroup(group: Group, projectId: string, meta: ApiMeta, callback: Function): void;
    removeGroup(groupId: string, projectId: string, meta: ApiMeta, callback: Function): void;
    addFeature(layerId: string, feature: any, meta: ApiMeta, callback: Function): void;
    getFeature(layerId: string, i: string, meta: ApiMeta, callback: Function): void;
    updateFeature(layerId: string, feature: any, useLog: boolean, meta: ApiMeta, callback: Function): void;
    addUpdateFeatureBatch(layerId: string, feature: ApiManager.IChangeEvent[], useLog: boolean, meta: ApiMeta, callback: Function): void;
    deleteFeature(layerId: string, featureId: string, meta: ApiMeta, callback: Function): void;
    updateProperty(layerId: string, featureId: string, property: string, value: any, useLog: boolean, meta: ApiMeta, callback: Function): void;
    updateLogs(layerId: string, featureId: string, logs: {
        [key: string]: Log[];
    }, meta: ApiMeta, callback: Function): void;
    addLog(layerId: string, featureId: string, property: string, log: Log, meta: ApiMeta, callback: Function): void;
    getLog(layerId: string, featureId: string, meta: ApiMeta, callback: Function): void;
    deleteLog(layerId: string, featureId: string, ts: number, prop: string, meta: ApiMeta, callback: Function): void;
    getBBox(layerId: string, southWest: number[], northEast: number[], meta: ApiMeta, callback: Function): void;
    getSphere(layerId: string, maxDistance: number, longtitude: number, latitude: number, meta: ApiMeta, callback: Function): void;
    getWithinPolygon(layerId: string, feature: Feature, meta: ApiMeta, callback: Function): void;
    initProject(project: Project): void;
    addProject(project: Project, meta: ApiMeta, callback: Function): void;
    getProject(projectId: any, meta: ApiMeta, callback: Function): void;
    updateProject(project: Project, meta: ApiMeta, callback: Function): void;
    deleteProject(projectId: any, meta: ApiMeta, callback: Function): void;
    addFile(base64: string, folder: string, file: string, meta: ApiMeta, callback: Function): void;
    addResource(resource: ApiManager.ResourceFile, meta: ApiMeta, callback: Function): void;
    /** Get a resource file  */
    getResource(resourceId: string, meta: ApiMeta, callback: Function): void;
    /** Get a specific key */
    getKey(keyId: string, meta: ApiMeta, callback: Function): void;
    /** Get a list of available keys */
    getKeys(meta: ApiMeta, callback: Function): void;
    /** Update the value for a given keyId */
    updateKey(keyId: string, value: Object, meta: ApiMeta, callback: Function): void;
    /** Delete key */
    deleteKey(keyId: string, meta: ApiMeta, callback: Function): void;
    init(layerManager: ApiManager.ApiManager, options: any, callback: Function): void;
    exit(callback: Function): void;
    /**
     * Subscribe to certain keys.
     * @method subscribeKey
     * @param  {string}     keyPattern Pattern to listen for, e.g. hello/me/+:person listens for all hello/me/xxx topics.
     * @param  {ApiMeta}    meta       [description]
     * @param  {Function}   callback   Called when topic is called.
     * @return {[type]}                [description]
     */
    subscribeKey(keyPattern: string, meta: ApiMeta, callback: (topic: string, message: string, params?: Object) => void): void;
}
