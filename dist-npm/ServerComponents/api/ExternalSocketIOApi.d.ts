import ApiManager = require('./ApiManager');
import Project = ApiManager.Project;
import Layer = ApiManager.Layer;
import Feature = ApiManager.Feature;
import Log = ApiManager.Log;
import ClientConnection = require('./../dynamic/ClientConnection');
import ApiMeta = ApiManager.ApiMeta;
import BaseConnector = require('./BaseConnector');
export declare class ExternalSocketIOAPI extends BaseConnector.BaseConnector {
    connection: ClientConnection.ConnectionManager;
    manager: ApiManager.ApiManager;
    constructor(connection: ClientConnection.ConnectionManager);
    init(layerManager: ApiManager.ApiManager, options: any, callback: Function): void;
    /** Sends a message (json) to a specific project, only works with socket io for now */
    sendClientMessage(project: string, message: Object): void;
    addLayer(layer: Layer, meta: ApiMeta, callback: Function): void;
    updateLayer(layer: Layer, meta: ApiMeta, callback: Function): void;
    deleteLayer(layerId: string, meta: ApiMeta, callback: Function): void;
    initLayer(layer: Layer): void;
    addProject(project: Project, meta: ApiMeta, callback: Function): void;
    updateProject(project: Project, meta: ApiMeta, callback: Function): void;
    deleteProject(projectId: string, meta: ApiMeta, callback: Function): void;
    initProject(project: Project): void;
    addFeature(layerId: string, feature: Feature, meta: ApiMeta, callback: Function): void;
    updateFeature(layerId: string, feature: Feature, useLog: boolean, meta: ApiMeta, callback: Function): void;
    updateLogs(layerId: string, featureId: string, logs: {
        [key: string]: Log[];
    }, meta: ApiMeta, callback: Function): void;
    deleteFeature(layerId: string, featureId: string, meta: ApiMeta, callback: Function): void;
    updateKey(keyId: string, value: Object, meta: ApiMeta, callback: Function): void;
}
