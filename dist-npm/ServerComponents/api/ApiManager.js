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
var Winston = require("winston");
var helpers = require("../helpers/Utils");
var fs = require("fs");
var path = require("path");
var events = require("events");
var _ = require("underscore");
var async = require("async");
var StringExt = require('../helpers/StringExt'); // to remove the BOM.
/**
 * Api Result status
 */
var ApiResult;
(function (ApiResult) {
    ApiResult[ApiResult["OK"] = 200] = "OK";
    ApiResult[ApiResult["Error"] = 400] = "Error";
    ApiResult[ApiResult["LayerAlreadyExists"] = 406] = "LayerAlreadyExists";
    ApiResult[ApiResult["LayerNotFound"] = 407] = "LayerNotFound";
    ApiResult[ApiResult["FeatureNotFound"] = 408] = "FeatureNotFound";
    ApiResult[ApiResult["ProjectAlreadyExists"] = 409] = "ProjectAlreadyExists";
    ApiResult[ApiResult["ProjectNotFound"] = 410] = "ProjectNotFound";
    ApiResult[ApiResult["KeyNotFound"] = 411] = "KeyNotFound";
    ApiResult[ApiResult["GroupNotFound"] = 412] = "GroupNotFound";
    ApiResult[ApiResult["GroupAlreadyExists"] = 413] = "GroupAlreadyExists";
    ApiResult[ApiResult["ResourceNotFound"] = 428] = "ResourceNotFound";
    ApiResult[ApiResult["ResourceAlreadyExists"] = 429] = "ResourceAlreadyExists";
    ApiResult[ApiResult["SearchNotImplemented"] = 440] = "SearchNotImplemented";
})(ApiResult = exports.ApiResult || (exports.ApiResult = {}));
/**
 * Default result object for api calls
 */
var CallbackResult = (function () {
    function CallbackResult() {
    }
    return CallbackResult;
}());
exports.CallbackResult = CallbackResult;
/** Event emitted by the ApiManager */
var Event;
(function (Event) {
    Event[Event["KeyChanged"] = 0] = "KeyChanged";
    Event[Event["PropertyChanged"] = 1] = "PropertyChanged";
    Event[Event["FeatureChanged"] = 2] = "FeatureChanged";
    Event[Event["LayerChanged"] = 3] = "LayerChanged";
    Event[Event["ProjectChanged"] = 4] = "ProjectChanged";
    Event[Event["FeaturesChanged"] = 5] = "FeaturesChanged";
})(Event = exports.Event || (exports.Event = {}));
/** Type of change in an ApiEvent */
var ChangeType;
(function (ChangeType) {
    ChangeType[ChangeType["Create"] = 0] = "Create";
    ChangeType[ChangeType["Update"] = 1] = "Update";
    ChangeType[ChangeType["Delete"] = 2] = "Delete";
})(ChangeType = exports.ChangeType || (exports.ChangeType = {}));
var Key = (function () {
    function Key() {
    }
    return Key;
}());
exports.Key = Key;
/**
 * Project definition
 */
var Project = (function () {
    function Project() {
    }
    return Project;
}());
exports.Project = Project;
var Group = (function () {
    function Group() {
    }
    return Group;
}());
exports.Group = Group;
var ApiKeySubscription = (function () {
    function ApiKeySubscription() {
    }
    return ApiKeySubscription;
}());
exports.ApiKeySubscription = ApiKeySubscription;
/**
 * Geojson Layer definition
 */
var Layer = (function () {
    function Layer() {
        this.features = [];
    }
    return Layer;
}());
exports.Layer = Layer;
/**
 * Geojson ProjectId definition
 */
var ProjectId = (function () {
    function ProjectId() {
    }
    return ProjectId;
}());
exports.ProjectId = ProjectId;
/**
 * Geojson geometry definition
 */
var Geometry = (function () {
    function Geometry() {
    }
    return Geometry;
}());
exports.Geometry = Geometry;
/**
 * Geojson feature definition
 */
var Feature = (function () {
    function Feature() {
        this.type = 'Feature';
    }
    return Feature;
}());
exports.Feature = Feature;
/**
 * Geojson property definition
 */
var Property = (function () {
    function Property() {
    }
    return Property;
}());
exports.Property = Property;
var Log = (function () {
    function Log() {
    }
    return Log;
}());
exports.Log = Log;
var FeatureType = (function () {
    function FeatureType() {
    }
    return FeatureType;
}());
exports.FeatureType = FeatureType;
var PropertyType = (function () {
    function PropertyType() {
    }
    return PropertyType;
}());
exports.PropertyType = PropertyType;
var ResourceFile = (function () {
    function ResourceFile() {
    }
    return ResourceFile;
}());
exports.ResourceFile = ResourceFile;
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
var ApiManager = (function (_super) {
    __extends(ApiManager, _super);
    /** Create a new client, optionally specifying whether it should act as client. */
    function ApiManager(namespace, name, isClient, options) {
        if (isClient === void 0) { isClient = false; }
        if (options === void 0) { options = {}; }
        var _this = _super.call(this) || this;
        _this.isClient = isClient;
        _this.options = options;
        /**
         * Dictionary of connectors (e.g. storage, interface, etc.)
         */
        _this.connectors = {};
        /**
         * Dictionary of resources
         */
        _this.resources = {};
        /**
         * Dictionary of layers (doesn't contain actual data)
         */
        _this.layers = {};
        /**
         * Dictionary of projects (doesn't contain actual data)
         */
        _this.projects = {};
        /**
         * Dictionary of sensor sets
         */
        _this.keys = {};
        _this.keySubscriptions = {};
        _this.defaultStorage = 'file';
        _this.defaultLogging = false;
        _this.rootPath = '';
        // public resourceFolder = '/data/resourceTypes';
        _this.projectsFile = '';
        _this.layersFile = '';
        /** The namespace is used for creating channels/layers/keys namespaces */
        _this.namespace = 'cs';
        /** The name is used to identify this instance, and should be unique in the federation */
        _this.name = 'cs';
        /**
         * Have a 1 sec. delay before saving project config
         */
        _this.saveProjectDelay = _.debounce(function (project) {
            _this.saveProjectConfig();
        }, 1000);
        /**
         * Have a 1 sec. delay before saving layer config
         */
        _this.saveLayersDelay = _.debounce(function (layer) {
            _this.saveLayerConfig();
        }, 1000);
        _this.setMaxListeners(25);
        _this.namespace = namespace;
        _this.name = name;
        if (_this.options.server) {
            // If we do not specify the protocal, add it
            if (_this.options.server.indexOf('http') < 0) {
                _this.options.server = 'http://' + _this.options.server;
            }
            // If we specify the trailing slash, remove it
            if (_this.options.server.slice(-1) === '/') {
                _this.options.server = _this.options.server.slice(0, -1);
            }
        }
        return _this;
    }
    ApiManager.prototype.init = function (rootPath, callback) {
        var _this = this;
        Winston.info("Init layer manager (isClient=" + this.isClient + ")", { cat: 'api' });
        this.rootPath = rootPath;
        if (!fs.existsSync(rootPath)) {
            fs.mkdirSync(rootPath);
        }
        //this.initResources(path.join(this.rootPath, '/resourceTypes/'));
        this.loadLayerConfig(function () {
            _this.loadProjectConfig(function () {
                callback();
            });
        });
    };
    /** Sends a message (json) to a specific project, only works with socket io for now */
    ApiManager.prototype.sendClientMessage = function (project, message) {
        if (this.connectors.hasOwnProperty('socketio')) {
            var c = this.connectors['socketio'];
            c.sendClientMessage(project, message);
        }
    };
    /** Open layer config file*/
    ApiManager.prototype.loadLayerConfig = function (cb) {
        var _this = this;
        Winston.debug('manager: loading layer config');
        this.layersFile = path.join(this.rootPath, 'layers.json');
        fs.stat(this.layersFile, function (err, stats) {
            // Create file if it doesn't exist
            if (err && err.code === 'ENOENT') {
                fs.writeFileSync(_this.layersFile, '{}');
                Winston.info("Create layers.json file " + _this.layersFile);
            }
            fs.readFile(_this.layersFile, 'utf8', function (err, data) {
                if (err) {
                    Winston.error('manager: layers config loading failed: ' + err.message);
                }
                else {
                    try {
                        _this.layers = JSON.parse(data);
                        Winston.info('manager: layers config loaded');
                    }
                    catch (e) {
                        Winston.error('manager: error loading layers config');
                    }
                }
                cb();
            });
        });
    };
    /**
     * Open project config file
     */
    ApiManager.prototype.loadProjectConfig = function (cb) {
        var _this = this;
        Winston.debug('manager: loading project config');
        this.projectsFile = path.join(this.rootPath, 'projects.json');
        fs.stat(this.projectsFile, function (err, stats) {
            // Create file if it doesn't exist            
            if (err && err.code === 'ENOENT') {
                fs.writeFileSync(_this.projectsFile, '{}');
                Winston.info("Create projects.json file " + _this.projectsFile);
            }
            fs.readFile(_this.projectsFile, 'utf8', function (err, data) {
                if (err) {
                    Winston.error('manager: project config loading failed: ' + err.message);
                }
                else {
                    try {
                        _this.projects = JSON.parse(data);
                        Winston.info('manager: project config loaded');
                    }
                    catch (e) {
                        Winston.error('manager: error loading project config');
                    }
                }
                cb();
            });
        });
    };
    /**
     * Store layer config file
     */
    ApiManager.prototype.saveProjectConfig = function () {
        fs.writeFile(this.projectsFile, JSON.stringify(this.projects), function (error) {
            if (error) {
                Winston.error('manager: error saving project config: ' + error.message);
            }
            else {
                Winston.info('manager: project config saved');
            }
        });
    };
    /**
     * Store layer config file
     */
    ApiManager.prototype.saveLayerConfig = function () {
        var temp = {};
        for (var s in this.layers) {
            if (!this.layers[s].storage) {
                temp[s] = this.layers[s];
            }
        }
        if (!temp) {
            return;
        }
        fs.writeFile(this.layersFile, JSON.stringify(temp), function (error) {
            if (error) {
                Winston.error('manager: error saving layer config');
            }
            else {
                Winston.info('manager: layer config saved');
            }
        });
    };
    /**
     * Look for available resources (from folder)
     */
    ApiManager.prototype.initResources = function (resourcesPath) {
        var _this = this;
        //TODO implement
        if (!fs.existsSync(resourcesPath)) {
            fs.mkdirSync(resourcesPath);
        }
        fs.readdir(resourcesPath, function (e, f) {
            f.forEach(function (file) {
                var loc = path.join(resourcesPath, file);
                fs.readFile(loc, 'utf8', function (err, data) {
                    if (!err) {
                        console.log('Opening ' + loc);
                        if (data.length > 0) {
                            _this.resources[file.replace('.json', '').toLowerCase()] = JSON.parse(data.removeBOM());
                        }
                    }
                    else {
                        console.log('Error opening ' + loc + ': ' + err);
                    }
                    ;
                });
            });
        });
    };
    /** Add a file to the store, e.g. an icon or other media. */
    ApiManager.prototype.addFile = function (base64, folder, file, meta, callback) {
        var s = this.connectors.hasOwnProperty('file') ? this.connectors['file'] : null;
        if (s) {
            s.addFile(base64, folder, file, meta, function () { });
            callback({ result: ApiResult.OK, error: 'Resource added' });
        }
        else {
            callback({ result: ApiResult.Error, error: 'Failed to add resource.' });
        }
    };
    /**
     * Update/add a resource and save it to file
     */
    ApiManager.prototype.addResource = function (resource, replace, meta, callback) {
        if (this.resources.hasOwnProperty(resource.id) && !replace) {
            callback({ result: ApiResult.ResourceAlreadyExists, error: 'Resource already exists' });
        }
        else {
            // reuse existing local file location
            if (this.resources.hasOwnProperty(resource.id)) {
                resource._localFile = this.resources[resource.id]._localFile;
            }
            // create new resource definition (without actual content)
            this.resources[resource.id] = { _localFile: resource._localFile, id: resource.id, title: resource.title, storage: resource.storage };
            // don't actually save it, if this method is called from the storage connector it self
            if (resource.storage != meta.source) {
                var s = this.findStorage(resource);
                this.getInterfaces(meta).forEach(function (i) {
                    i.addResource(resource, meta, function () { });
                });
                // store resource
                if (s) {
                    s.addResource(resource, meta, function (r) {
                        callback({ result: ApiResult.OK, error: 'Resource added' });
                    });
                }
                else {
                    callback({ result: ApiResult.OK });
                }
            }
        }
    };
    ApiManager.prototype.getResource = function (id, meta, callback) {
        if (this.resources.hasOwnProperty(id)) {
            var s = this.findStorage(this.resources[id]);
            if (s) {
                s.getResource(id, meta, function (r) {
                    callback(r);
                });
            }
            else {
                callback({ result: ApiResult.ResourceNotFound });
            }
        }
        else {
            callback({ result: ApiResult.ResourceNotFound });
        }
    };
    ApiManager.prototype.addLayerToProject = function (projectId, groupId, layerId, meta, callback) {
        var p = this.findProject(projectId);
        var l = this.findLayer(layerId);
        if (!p) {
            callback({ result: ApiResult.ProjectNotFound, error: 'Project not found' });
            return;
        }
        if (!l) {
            callback({ result: ApiResult.LayerNotFound, error: 'Layer not found' });
            return;
        }
        if (!p.groups) {
            p.groups = [];
        }
        var g;
        p.groups.forEach(function (pg) {
            if (pg.id === groupId) {
                g = pg;
            }
        });
        if (!g) {
            callback({ result: ApiResult.GroupNotFound, error: 'Group not found' });
            return;
        }
        if (g.layers.some(function (pl) { return (pl.id === l.id); })) {
            Winston.info('Layer already exists. Removing existing layer before adding new one...');
            g.layers = g.layers.filter(function (gl) { return (gl.id !== l.id); });
        }
        g.layers.push(l);
        this.updateProject(p, meta, function () {
            Winston.info('api: add layer ' + l.id + ' to group ' + g.id + ' of project ' + p.id);
            callback({ result: ApiResult.OK });
        });
    };
    ApiManager.prototype.removeLayerFromProject = function (projectId, groupId, layerId, meta, callback) {
        var p = this.findProject(projectId);
        if (!p) {
            callback({ result: ApiResult.ProjectNotFound, error: 'Project not found' });
            return;
        }
        if (!p.groups || !p.groups.some(function (pg) { return (pg.id === groupId); })) {
            callback({ result: ApiResult.GroupNotFound, error: 'Group not found' });
            return;
        }
        else {
            var group = p.groups.filter(function (pg) { return (pg.id === groupId); })[0];
            if (group.layers.some(function (pl) { return (pl.id === layerId); })) {
                group.layers = group.layers.filter(function (pl) { return (pl.id !== layerId); });
                this.updateProject(p, meta, function () { });
                Winston.info('api: removed layer ' + layerId + ' from project ' + p.id);
                callback({ result: ApiResult.OK });
            }
            else {
                callback({ result: ApiResult.LayerNotFound, error: 'Layer not found' });
                return;
            }
        }
    };
    ApiManager.prototype.allGroups = function (projectId, meta, callback) {
        var p = this.findProject(projectId);
        if (!p) {
            callback({ result: ApiResult.ProjectNotFound, error: 'Project not found' });
            return;
        }
        if (!p.groups) {
            p.groups = [];
        }
        var groupList = [];
        p.groups.forEach(function (pg) {
            if (pg.id) {
                groupList.push(pg.id);
            }
        });
        callback({ result: ApiResult.OK, groups: groupList });
    };
    ApiManager.prototype.addGroup = function (group, projectId, meta, callback) {
        var p = this.findProject(projectId);
        if (!p) {
            callback({ result: ApiResult.ProjectNotFound, error: 'Project not found' });
            return;
        }
        if (!p.groups) {
            p.groups = [];
        }
        if (!group.id) {
            group.id = helpers.newGuid();
        }
        if (p.groups.some(function (pg) { return (group.id === pg.id); })) {
            p.groups.some(function (pg) {
                if (group.id === pg.id && group.clusterLevel) {
                    pg['clusterLevel'] = group.clusterLevel;
                }
                if (group.id === pg.id && group.hasOwnProperty('clustering')) {
                    pg['clustering'] = group.clustering;
                }
                return (group.id === pg.id);
            });
            callback({ result: ApiResult.GroupAlreadyExists, error: 'Group exists' });
            return;
        }
        else {
            group = this.getGroupDefinition(group);
            p.groups.push(group);
            this.updateProject(p, meta, function () { });
            callback({ result: ApiResult.OK });
        }
    };
    ApiManager.prototype.updateGroup = function (projectId, groupId, newGroup, meta, callback) {
        var p = this.findProject(projectId);
        if (!p) {
            callback({ result: ApiResult.ProjectNotFound, error: 'Project not found' });
            return;
        }
        if (!newGroup || !groupId || !p.groups) {
            callback({ result: ApiResult.GroupNotFound, error: 'Group Not Found' });
            return;
        }
        if (p.groups.some(function (pg) { return (groupId === pg.id); })) {
            p.groups.some(function (pg) {
                if (groupId === pg.id) {
                    Object.keys(newGroup).forEach(function (key) {
                        pg[key] = newGroup[key];
                    });
                    return true;
                }
                return false;
            });
            this.updateProject(p, meta, function () { });
            callback({ result: ApiResult.OK });
            return;
        }
        else {
            callback({ result: ApiResult.GroupNotFound, error: 'Group Not Found' });
            return;
        }
    };
    ApiManager.prototype.removeGroup = function (groupId, projectId, meta, callback) {
        var _this = this;
        var p = this.findProject(projectId);
        if (!p) {
            callback({ result: ApiResult.ProjectNotFound, error: 'Project not found' });
            return;
        }
        if (!p.groups) {
            p.groups = [];
        }
        if (!p.groups.some(function (pg) { return (groupId === pg.id); })) {
            callback({ result: ApiResult.GroupNotFound, error: 'Group not found' });
            return;
        }
        else {
            var group = p.groups.filter(function (pg) { return (groupId === pg.id); })[0];
            group.layers.forEach(function (pl) {
                _this.removeLayerFromProject(projectId, groupId, pl.id, meta, function () { });
            });
            p.groups = p.groups.filter(function (pg) { return (pg.id !== groupId); });
            callback({ result: ApiResult.OK });
        }
    };
    ApiManager.prototype.addProject = function (project, meta, callback) {
        var _this = this;
        if (!project.id) {
            project.id = helpers.newGuid();
        }
        Winston.info('api: add project ' + project.id);
        var s = this.findStorage(project);
        project.storage = project.storage || s.id;
        // check if layer already exists
        if (!this.projects.hasOwnProperty(project.id)) {
            this.projects[project.id] = this.getProjectDefinition(project);
            // store project
            var meta = { source: 'rest' };
            this.getInterfaces(meta).forEach(function (i) {
                i.initProject(_this.projects[project.id]);
                i.addProject(_this.projects[project.id], meta, function () { });
            });
            s.addProject(this.projects[project.id], meta, function (r) {
                _this.emit(Event[Event.ProjectChanged], { id: project.id, type: ChangeType.Create, value: project });
                callback(r);
            });
            this.saveProjectDelay(this.projects[project.id]);
        }
        else {
            callback({ result: ApiResult.ProjectAlreadyExists, project: this.projects[project.id], error: 'Project already exists' });
        }
    };
    /**
     * Add connector to available connectors
     */
    ApiManager.prototype.addConnector = function (key, s, options, callback) {
        if (callback === void 0) { callback = function () { }; }
        // TODO If client, check that only one interface is added (isInterface = true)
        s.id = key;
        this.connectors[key] = s;
        s.init(this, options, function () {
            callback();
        });
    };
    ApiManager.prototype.addConnectors = function (connectors, callback) {
        var _this = this;
        connectors.forEach(function (c) {
            c.s.id = c.key;
            _this.connectors[c.key] = c.s;
        });
        async.eachSeries(connectors, function (c, callb) {
            c.s.init(_this, c.options, function () { });
            callb();
        }, function () {
            callback();
        });
    };
    /**
     * Find layer for a specific layerId (can return null)
     */
    ApiManager.prototype.findLayer = function (layerId) {
        if (this.layers.hasOwnProperty(layerId)) {
            return this.layers[layerId];
        }
        return null;
    };
    /**
     * Find project for a specific projectId (can return null)
     */
    ApiManager.prototype.findProject = function (projectId) {
        if (this.projects.hasOwnProperty(projectId)) {
            return this.projects[projectId];
        }
        return null;
    };
    /**
     * Find layer for a specific layerId (can return null)
     */
    ApiManager.prototype.findKey = function (keyId) {
        return this.keys.hasOwnProperty(keyId)
            ? this.keys[keyId]
            : null;
    };
    /**
     * find feature in a layer by featureid
     */
    ApiManager.prototype.findFeature = function (layerId, featureId, callback) {
        var layer = this.findLayer(layerId);
        var s = this.findStorage(layer);
        s.getFeature(layerId, featureId, {}, function (r) { return callback(r); });
    };
    /**
     * Find storage for a layer
     */
    ApiManager.prototype.findStorage = function (object) {
        var storage = (object && object.storage) || this.defaultStorage;
        if (this.connectors.hasOwnProperty(storage)) {
            return this.connectors[storage];
        }
        return null;
    };
    /**
     * Lookup layer and return storage engine for this layer
     */
    ApiManager.prototype.findStorageForLayerId = function (layerId) {
        var layer = this.findLayer(layerId);
        // Winston.info('Find layer ' + JSON.stringify(layer));
        return this.findStorage(layer);
    };
    /**
     * Lookup Project and return storage engine for this project
     */
    ApiManager.prototype.findStorageForProjectId = function (projectId) {
        var project = this.findProject(projectId);
        return this.findStorage(project);
    };
    /**
     * Lookup layer and return storage engine for this layer
     */
    ApiManager.prototype.findStorageForKeyId = function (keyId) {
        var key = this.findKey(keyId);
        return this.findStorage(key);
    };
    /**
     * Make sure the project has an unique project id
     */
    ApiManager.prototype.getProjectId = function (project) {
        project.id = project.id.replace(new RegExp(' ', 'g'), '');
        return project.id;
    };
    /**
     * Returns project definition for a project
     */
    ApiManager.prototype.getProjectDefinition = function (project) {
        var _this = this;
        var p = {
            id: project.id ? project.id : helpers.newGuid(),
            storage: project.storage ? project.storage : '',
            title: project.title ? project.title : project.id,
            isDynamic: (typeof project.isDynamic !== 'undefined') ? project.isDynamic : true,
            logo: project.logo ? project.logo : 'images/CommonSenseRound.png',
            groups: project.groups ? _.map(project.groups, function (g) { return _this.getGroupDefinition(g); }) : [],
            url: project.url ? project.url : '/api/projects/' + project.id,
            _localFile: project._localFile
        };
        return p;
    };
    /**
     * Returns project definition for a project
     */
    ApiManager.prototype.getGroupDefinition = function (group) {
        var _this = this;
        var g = {
            id: group.id ? group.id : helpers.newGuid(),
            description: group.description ? group.description : '',
            title: group.title ? group.title : group.id,
            clusterLevel: group.clusterLevel ? group.clusterLevel : 19,
            clustering: group.clustering || false,
            layers: group.layers ? _.map(group.layers, function (l) { return _this.getLayerDefinition(l); }) : []
        };
        return g;
    };
    /**
     * Returns layer definition for a layer, this is the layer without the features (mostly used for directory)
     */
    ApiManager.prototype.getLayerDefinition = function (layer) {
        if (!layer.hasOwnProperty('type')) {
            layer.type = 'geojson';
        }
        var server = this.options.server || '';
        var r = {
            server: server,
            id: layer.id,
            title: layer.title,
            updated: layer.updated,
            enabled: layer.enabled,
            description: layer.description,
            dynamicResource: layer.dynamicResource,
            defaultFeatureType: layer.defaultFeatureType,
            defaultLegendProperty: layer.defaultLegendProperty,
            typeUrl: layer.typeUrl,
            quickRefresh: layer.quickRefresh,
            confirmUpdate: layer.confirmUpdate,
            opacity: layer.opacity ? layer.opacity : 75,
            type: layer.type,
            // We are returning a definition, so remove the data
            features: [],
            data: '',
            storage: layer.storage ? layer.storage : '',
            url: layer.url ? layer.url : (server + '/api/layers/' + layer.id),
            isDynamic: layer.isDynamic ? layer.isDynamic : false
        };
        // Copy additional properties too.
        for (var key in layer) {
            if (layer.hasOwnProperty(key) && !r.hasOwnProperty(key)) {
                r[key] = layer[key];
            }
        }
        return r;
    };
    //layer methods start here, in CRUD order.
    ApiManager.prototype.getProject = function (projectId, meta, callback) {
        Winston.debug('Looking for storage of project ' + projectId);
        var s = this.findStorageForProjectId(projectId);
        if (s) {
            Winston.debug('Found storage ' + s.id + ' for project ' + projectId);
            s.getProject(projectId, meta, function (r) { callback(r); });
        }
        else {
            Winston.warn('Project ' + projectId + ' not found.');
            callback({ result: ApiResult.ProjectNotFound });
        }
    };
    ApiManager.prototype.searchLayers = function (keyword, layerIds, meta, callback) {
        var _this = this;
        if (!layerIds || layerIds.length === 0) {
            layerIds = _.keys(this.layers);
        }
        var result = [];
        async.each(layerIds, function (lId, callback) {
            var storage = _this.findStorageForLayerId(lId);
            if (storage != null) {
                storage.searchLayer(lId, keyword, meta, function (r) {
                    if (r.result === ApiResult.OK) {
                        r.features.forEach(function (f) { return result.push(f); });
                    }
                    callback();
                });
            }
        }, function (error) {
            if (!error) {
                callback({ result: ApiResult.OK, features: result });
            }
            else {
                callback({ result: ApiResult.Error });
            }
        });
    };
    ApiManager.prototype.getLayer = function (layerId, meta, callback) {
        var s = this.findStorageForLayerId(layerId);
        if (s) {
            s.getLayer(layerId, meta, function (r) { callback(r); });
        }
        else {
            Winston.warn('Layer ' + layerId + ' not found.');
            callback({ result: ApiResult.LayerNotFound });
        }
    };
    /** Create a new layer, store it, and return it. */
    ApiManager.prototype.createLayer = function (layer, meta, callback) {
        // give it an id if not available
        if (!layer.hasOwnProperty('id')) {
            layer.id = helpers.newGuid();
        }
        // make sure layerid is lowercase
        layer.id = layer.id.toLowerCase();
        // take the id for the title if not available
        if (!layer.hasOwnProperty('title')) {
            layer.title = layer.id;
        }
        if (!layer.hasOwnProperty('features')) {
            layer.features = [];
        }
        if (!layer.hasOwnProperty('tags')) {
            layer.tags = [];
        }
        this.setUpdateLayer(layer, meta);
        Winston.info('api: add layer ' + layer.id);
        // If the layer already exists, overwrite it (we may have received a new description, for example, or a new location)
        var s = this.findStorage(layer);
        // add storage connector if available
        layer.storage = s ? s.id : '';
        // get layer definition (without features)
        this.layers[layer.id] = this.getLayerDefinition(layer);
        this.getInterfaces(meta).forEach(function (i) {
            i.initLayer(layer);
            //    i.addLayer(layer, meta, () => { });
        });
        // store layer
        if (s && s.id != meta.source) {
            s.addLayer(layer, meta, function (r) { return callback(r); });
        }
        else {
            callback({ result: ApiResult.OK });
        }
    };
    ApiManager.prototype.addUpdateLayer = function (layer, meta, callback) {
        var _this = this;
        async.series([
            // make sure layer exists
            function (cb) {
                _this.createLayer(layer, meta, function () {
                    cb();
                });
            },
            // update layer
            function (cb) {
                _this.setUpdateLayer(layer, meta);
                var l = _this.getLayerDefinition(layer);
                _this.layers[l.id] = l;
                _this.getInterfaces(meta).forEach(function (i) {
                    i.updateLayer(layer, meta, function () { });
                });
                var s = _this.findStorage(layer);
                if (s && s.id !== meta.source) {
                    s.updateLayer(layer, meta, function (r, CallbackResult) {
                        Winston.debug('updating layer finished');
                    });
                }
                callback({ result: ApiResult.OK });
                _this.emit(Event[Event.LayerChanged], { id: layer.id, type: ChangeType.Update, value: layer });
                _this.saveLayersDelay(layer);
                cb();
            }
        ]);
    };
    // Removes all groups (and thus layers too) from a project
    ApiManager.prototype.clearProject = function (projectId, meta, callback) {
        var p = this.findProject(projectId);
        if (!p) {
            callback({ result: ApiResult.ProjectNotFound, error: 'Project not found' });
            return;
        }
        p.groups = [];
        this.updateProject(p, {}, function (result) {
            callback(result);
        });
    };
    ApiManager.prototype.updateProjectTitle = function (projectTitle, projectId, meta, callback) {
        // Does not send update to connections and storages, should be done separately!
        var p = this.findProject(projectId);
        if (!p) {
            callback({ result: ApiResult.ProjectNotFound, error: 'Project not found' });
            return;
        }
        p.title = projectTitle;
        this.projects[projectId] = p;
        callback({ result: ApiResult.OK, error: 'Changed title' });
    };
    ApiManager.prototype.updateProject = function (project, meta, callback) {
        var _this = this;
        async.series([
            // make sure project exists
            function (cb) {
                if (!_this.projects.hasOwnProperty(project.id)) {
                    _this.addProject(project, meta, function () {
                        cb();
                    });
                }
                else {
                    cb();
                }
            },
            // update project
            function (cb) {
                var file = _this.projects[project.id]._localFile;
                if (file && !project._localFile)
                    project._localFile = file;
                var p = _this.getProjectDefinition(project);
                _this.projects[p.id] = p;
                _this.getInterfaces(meta).forEach(function (i) {
                    i.updateProject(project, meta, function () { });
                });
                var s = _this.findStorageForProjectId(project.id);
                if (s) {
                    s.updateProject(project, meta, function (r, CallbackResult) {
                        Winston.warn('updating project finished');
                    });
                }
                callback({ result: ApiResult.OK, project: p });
                _this.emit(Event[Event.ProjectChanged], { id: project.id, type: ChangeType.Update, value: project });
                _this.saveProjectDelay(project);
            }
        ]);
    };
    ApiManager.prototype.deleteLayer = function (layerId, meta, callback) {
        var _this = this;
        var s = this.findStorageForLayerId(layerId);
        s.deleteLayer(layerId, meta, function (r) {
            delete _this.layers[layerId];
            _this.getInterfaces(meta).forEach(function (i) {
                i.deleteLayer(layerId, meta, function () { });
            });
            _this.emit(Event[Event.LayerChanged], { id: layerId, type: ChangeType.Delete });
            callback(r);
        });
    };
    ApiManager.prototype.deleteProject = function (projectId, meta, callback) {
        var _this = this;
        var s = this.findStorageForProjectId(projectId);
        if (!s) {
            callback({ result: ApiResult.Error, error: 'Project not found.' });
            return;
        }
        s.deleteProject(projectId, meta, function (r) {
            delete _this.projects[projectId];
            _this.getInterfaces(meta).forEach(function (i) {
                i.deleteProject(projectId, meta, function () { });
            });
            _this.emit(Event[Event.ProjectChanged], { id: projectId, type: ChangeType.Delete });
            callback(r);
        });
    };
    ApiManager.prototype.getInterfaces = function (meta) {
        var res = [];
        for (var i in this.connectors) {
            if (this.connectors[i].isInterface && (this.connectors[i].receiveCopy || meta.source !== i)) {
                res.push(this.connectors[i]);
            }
        }
        return res;
    };
    ApiManager.prototype.setUpdateLayer = function (layer, meta) {
        layer.updated = new Date().getTime();
    };
    // Feature methods start here, in CRUD order.
    ApiManager.prototype.addFeature = function (layerId, feature, meta, callback) {
        var _this = this;
        Winston.debug('feature added');
        var layer = this.findLayer(layerId);
        if (!layer) {
            callback({ result: ApiResult.Error, error: 'layer not found' });
        }
        else {
            this.setUpdateLayer(layer, meta);
            var s = this.findStorage(layer);
            if (s)
                s.addFeature(layerId, feature, meta, function (result) {
                    _this.getInterfaces(meta).forEach(function (i) {
                        i.addFeature(layerId, feature, meta, function () { });
                    });
                    _this.emit(Event[Event.FeatureChanged], { id: layerId, type: ChangeType.Create, value: feature });
                    callback({ result: ApiResult.OK });
                });
        }
    };
    ApiManager.prototype.updateProperty = function (layerId, featureId, property, value, useLog, meta, callback) {
        var layer = this.findLayer(layerId);
        this.setUpdateLayer(layer, meta);
        var s = this.findStorage(layer);
        this.updateProperty(layerId, featureId, property, value, useLog, meta, function (r) { return callback(r); });
        this.emit(Event[Event.PropertyChanged], { id: layerId, type: ChangeType.Update, value: { featureId: featureId, property: property } });
    };
    ApiManager.prototype.updateLogs = function (layerId, featureId, logs, meta, callback) {
        var layer = this.findLayer(layerId);
        this.setUpdateLayer(layer, meta);
        var s = this.findStorage(layer);
        // check if timestamps are set (if not, do it)
        for (var p in logs) {
            logs[p].forEach(function (l) {
                if (!l.ts)
                    l.ts = new Date().getTime();
            });
        }
        s.updateLogs(layerId, featureId, logs, meta, function (r) { return callback(r); });
        this.getInterfaces(meta).forEach(function (i) {
            i.updateLogs(layerId, featureId, logs, meta, function () { });
        });
    };
    ApiManager.prototype.getFeature = function (layerId, featureId, meta, callback) {
        var s = this.findStorageForLayerId(layerId);
        s.getFeature(layerId, featureId, meta, function (result) { return callback(result); });
    };
    ApiManager.prototype.updateFeature = function (layerId, feature, meta, callback) {
        Winston.info("ApiManger.updateFeature: Saving feature with id " + feature.id + " to layer " + layerId + ".");
        var s = this.findStorageForLayerId(layerId);
        if (s) {
            s.updateFeature(layerId, feature, true, meta, function (result) { return callback(result); });
        }
        else {
            Winston.error("ApiManger.updateFeature: Error saving feature with id " + feature.id + " to layer " + layerId + ".");
        }
        this.getInterfaces(meta).forEach(function (i) {
            i.updateFeature(layerId, feature, false, meta, function () { });
        });
        this.emit(Event[Event.FeatureChanged], { id: layerId, type: ChangeType.Update, value: feature });
    };
    /** Similar to updateFeature, but with an array of updated features instead of one feature.
     *
     */
    ApiManager.prototype.addUpdateFeatureBatch = function (layerId, features, meta, callback) {
        var s = this.findStorageForLayerId(layerId);
        if (s)
            s.addUpdateFeatureBatch(layerId, features, true, meta, function (result) { return callback(result); });
        this.getInterfaces(meta).forEach(function (i) {
            i.addUpdateFeatureBatch(layerId, features, false, meta, function () { });
        });
        this.emit(Event[Event.FeaturesChanged], { id: layerId, type: ChangeType.Update, value: features });
    };
    ApiManager.prototype.deleteFeature = function (layerId, featureId, meta, callback) {
        var _this = this;
        var s = this.findStorageForLayerId(layerId);
        if (s)
            s.deleteFeature(layerId, featureId, meta, function (result) {
                _this.getInterfaces(meta).forEach(function (i) {
                    i.deleteFeature(layerId, featureId, meta, function () { });
                });
                _this.emit(Event[Event.FeatureChanged], { id: layerId, type: ChangeType.Delete, value: featureId });
                callback(result);
            });
    };
    //log stuff (new: 26/7)
    ApiManager.prototype.addLog = function (layerId, featureId, property, log, meta, callback) {
        var s = this.findStorageForLayerId(layerId);
        s.addLog(layerId, featureId, property, log, meta, function (result) { return callback(result); });
    };
    ApiManager.prototype.initLayer = function (layer) {
    };
    ApiManager.prototype.initProject = function (project) {
    };
    ApiManager.prototype.getLog = function (layerId, featureId, meta, callback) {
        var s = this.findStorageForLayerId(layerId);
        s.getLog(layerId, featureId, meta, function (result) { return callback(result); });
    };
    ApiManager.prototype.deleteLog = function (layerId, featureId, ts, prop, meta, callback) {
        var s = this.findStorageForLayerId(layerId);
        s.deleteLog(layerId, featureId, ts, prop, meta, function (result) { return callback(result); });
    };
    //geospatial queries (thus only supported for mongo)
    ApiManager.prototype.getBBox = function (layerId, southWest, northEast, meta, callback) {
        var s = this.findStorageForLayerId(layerId);
        s.getBBox(layerId, southWest, northEast, meta, function (result) { return callback(result); });
    };
    ApiManager.prototype.getSphere = function (layerId, maxDistance, lng, lat, meta, callback) {
        var s = this.findStorageForLayerId(layerId);
        s.getSphere(layerId, maxDistance, lng, lat, meta, function (result) { return callback(result); });
    };
    ApiManager.prototype.getWithinPolygon = function (layerId, feature, meta, callback) {
        var s = this.findStorageForLayerId(layerId);
        s.getWithinPolygon(layerId, feature, meta, function (result) { return callback(result); });
    };
    ApiManager.prototype.subscribeKey = function (pattern, meta, callback) {
        Winston.debug('api: added key subscription with pattern ' + pattern);
        var sub = new ApiKeySubscription();
        sub.id = helpers.newGuid();
        sub.pattern = pattern;
        sub.regexPattern = new RegExp(pattern.replace(/\//g, '\\/').replace(/\./g, '\\.'));
        sub.callback = callback;
        this.keySubscriptions[sub.id] = sub;
        return sub;
        // this.getInterfaces(meta).forEach((i: IConnector) => {
        //     i.subscribeKey(pattern, meta, callback);
        // });
    };
    ApiManager.prototype.addKey = function (key, meta, callback) {
        Winston.debug('add key ' + key.id);
        var k = JSON.parse(JSON.stringify(key));
        delete k.values;
        this.keys[key.id] = k;
    };
    ApiManager.prototype.getKeys = function (meta, callback) {
        // check subscriptions
        callback({ result: ApiResult.OK, keys: this.keys });
    };
    ApiManager.prototype.getKey = function (id, meta, callback) {
        var s = this.findStorageForKeyId(id);
        if (s)
            s.getKey(id, meta, function (r) {
                callback(r);
            });
        else {
            callback({ result: ApiResult.KeyNotFound });
        }
    };
    ApiManager.prototype.updateKey = function (keyId, value, meta, callback) {
        if (!meta)
            meta = {};
        if (!callback)
            callback = function () { };
        // Winston.info('updatekey: received ' + keyId);
        // check if keys exists
        var key = this.findKey(keyId);
        if (!key) {
            var k = { id: keyId, title: keyId, storage: 'file' };
            this.addKey(k, meta, function () { });
        }
        if (typeof value === 'object' && !value.hasOwnProperty('time'))
            value['time'] = new Date().getTime();
        var s = this.findStorageForKeyId(keyId);
        if (s)
            s.updateKey(keyId, value, meta, function () { return callback(); });
        for (var subId in this.keySubscriptions) {
            var sub = this.keySubscriptions[subId];
            if (sub.regexPattern.test(keyId)) {
                //Winston.info(`   pattern ${sub.pattern} found.`);
                sub.callback(keyId, value, meta);
            }
        }
        this.getInterfaces(meta).forEach(function (i) {
            i.updateKey(keyId, value, meta, function () { });
        });
        // Emit key changed events so others can subscribe to it.
        this.emit(Event[Event.KeyChanged], { id: keyId, type: ChangeType.Update, value: value });
        // check subscriptions
        callback({ result: ApiResult.OK });
    };
    /**
     * Register a callback which is being called before the process exits.
     * @method cleanup
     * @param  {Function} callback Callback function that performs the cleanup
     * See also: http://stackoverflow.com/questions/14031763/doing-a-cleanup-action-just-before-node-js-exits
     */
    ApiManager.prototype.cleanup = function (callback) {
        // attach user callback to the process event emitter
        // if no callback, it will still exit gracefully on Ctrl-C
        if (!callback)
            callback = function () { };
        process.on('cleanup', callback);
        // do app specific cleaning before exiting
        process.on('exit', function () {
            process.emit('cleanup');
        });
        // catch ctrl+c event and exit normally
        process.on('SIGINT', function () {
            console.log('Ctrl-C...');
            process.exit(2);
        });
        //catch uncaught exceptions, trace, then exit normally
        process.on('uncaughtException', function (e) {
            console.log('Uncaught Exception...');
            console.log(e.stack);
            process.exit(99);
        });
    };
    ;
    return ApiManager;
}(events.EventEmitter));
exports.ApiManager = ApiManager;
//# sourceMappingURL=ApiManager.js.map