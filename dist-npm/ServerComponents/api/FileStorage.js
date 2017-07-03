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
var fs = require("fs-extra");
var path = require("path");
var ApiResult = ApiManager.ApiResult;
var BaseConnector = require("./BaseConnector");
var _ = require("underscore");
var chokidar = require('chokidar');
var StringExt = require('../helpers/StringExt'); // to remove the BOM.
var Winston = require("winston");
var helpers = require("../helpers/Utils");
var sift = require('sift');
var FileStorage = (function (_super) {
    __extends(FileStorage, _super);
    function FileStorage(rootpath, watch, ignoreInitial) {
        if (watch === void 0) { watch = true; }
        if (ignoreInitial === void 0) { ignoreInitial = false; }
        var _this = _super.call(this) || this;
        _this.rootpath = rootpath;
        _this.ignoreInitial = ignoreInitial;
        _this.layers = [];
        _this.projects = {};
        _this.keys = {};
        _this.resources = {};
        _this.layerDebounceFunctions = {};
        _this.saveProjectDelay = _.debounce(function (project) {
            _this.saveProjectFile(project);
        }, 2000);
        _this.saveResourcesDelay = _.debounce(function (res) {
            _this.saveResourceFile(res);
        }, 25);
        _this.saveKeyDelay = _.debounce(function (key) {
            _this.saveKeyFile(key);
        }, 5000);
        _this.receiveCopy = false;
        _this.backupPath = path.join(rootpath, 'backup/');
        _this.keysPath = path.join(rootpath, 'keys/');
        _this.layersPath = path.join(rootpath, 'layers/');
        _this.layersBackupPath = path.join(_this.backupPath, 'layers/');
        _this.projectsPath = path.join(rootpath, 'projects/');
        _this.resourcesPath = path.join(rootpath, 'resourceTypes/');
        _this.blobPath = path.join(rootpath, 'blobs/');
        _this.iconPath = path.join(rootpath, '../images/');
        // check if rootpath exists, otherwise create it, including its parents
        if (!fs.existsSync(rootpath)) {
            fs.mkdirsSync(rootpath);
        }
        if (!fs.existsSync(_this.backupPath)) {
            fs.mkdirsSync(_this.backupPath);
        }
        if (!fs.existsSync(_this.layersBackupPath)) {
            fs.mkdirsSync(_this.layersBackupPath);
        }
        if (!fs.existsSync(_this.iconPath)) {
            fs.mkdirsSync(_this.iconPath);
        }
        if (watch) {
            _this.watchLayersFolder();
            _this.watchKeysFolder();
            _this.watchProjectsFolder();
            _this.watchResourcesFolder();
        }
        return _this;
    }
    FileStorage.prototype.watchLayersFolder = function () {
        var _this = this;
        Winston.info('filestore: watch folder:' + this.layersPath);
        if (!fs.existsSync(this.layersPath)) {
            fs.mkdirSync(this.layersPath);
        }
        if (!fs.existsSync(path.join(this.layersPath, 'backup'))) {
            fs.mkdirSync(path.join(this.layersPath, 'backup'));
        }
        setTimeout(function () {
            var watcher = chokidar.watch(_this.layersPath, { ignoreInitial: _this.ignoreInitial, ignored: /[\/\\]\./, persistent: true });
            watcher.on('all', (function (action, path) {
                if (action === 'add') {
                    Winston.debug('filestore: new file found : ' + path);
                    _this.openLayerFile(path);
                }
                if (action === 'unlink') {
                    _this.closeLayerFile(path);
                    //this.removeLayer(path);
                }
                if (action === 'change') {
                    //this.addLayer(path);
                }
            }));
        }, 1500);
    };
    FileStorage.prototype.getDirectories = function (srcpath) {
        return fs.readdirSync(srcpath).filter(function (file) {
            return fs.statSync(path.join(srcpath, file)).isDirectory();
        });
    };
    FileStorage.prototype.watchProjectsFolder = function () {
        var _this = this;
        Winston.info('filestore: watch folder:' + this.projectsPath);
        if (!fs.existsSync(this.projectsPath)) {
            fs.mkdirSync(this.projectsPath);
        }
        setTimeout(function () {
            var watcher = chokidar.watch(_this.projectsPath, { ignoreInitial: _this.ignoreInitial, depth: 0, ignored: /[\/\\]\./, persistent: true });
            watcher.on('all', (function (action, path) {
                if (action === 'add') {
                    Winston.info('filestore: new project found : ' + path);
                    _this.openProjectFile(path);
                }
                if (action === 'unlink') {
                    _this.closeLayerFile(path);
                    //this.removeLayer(path);
                }
                if (action === 'change') {
                    //this.addLayer(path);
                }
            }));
            var folders = _this.getDirectories(_this.projectsPath);
            folders.forEach(function (folder) {
                _this.openStaticFolder(folder);
            });
        }, 1000);
    };
    FileStorage.prototype.openStaticFolder = function (folder) {
        var _this = this;
        // check if project file exists
        var f = path.join(this.projectsPath, folder);
        var projectFile = path.join(f, 'project.json');
        if (fs.existsSync(projectFile)) {
            this.openProjectFile(projectFile, folder, true);
            var rf = path.join(f, 'resources');
            if (fs.existsSync(rf)) {
                fs.readdir(rf, function (error, files) {
                    if (!error) {
                        files.forEach(function (file) {
                            _this.openResourceFile(path.join(rf, file));
                        });
                    }
                });
            }
            //Winston.error('project file found : ' + folder);
        }
        else {
            Winston.error('project file not found : ' + folder);
        }
    };
    FileStorage.prototype.watchKeysFolder = function () {
        var _this = this;
        Winston.info('filestore: watch folder:' + this.keysPath);
        if (!fs.existsSync(this.keysPath)) {
            fs.mkdirSync(this.keysPath);
        }
        setTimeout(function () {
            var watcher = chokidar.watch(_this.keysPath, { ignoreInitial: _this.ignoreInitial, ignored: /[\/\\]\./, persistent: true });
            watcher.on('all', (function (action, path) {
                if (!fs.statSync(path).isDirectory()) {
                    if (action === 'add') {
                        Winston.info('filestore: new file found : ' + path);
                        _this.openKeyFile(path);
                    }
                    if (action === 'unlink') {
                        _this.closeKeyFile(path);
                    }
                    if (action === 'change') {
                    }
                }
            }));
        }, 2500);
    };
    FileStorage.prototype.watchResourcesFolder = function () {
        var _this = this;
        Winston.info('filestore: watch folder:' + this.resourcesPath);
        if (!fs.existsSync(this.resourcesPath)) {
            fs.mkdirSync(this.resourcesPath);
        }
        setTimeout(function () {
            var watcher = chokidar.watch(_this.resourcesPath, { ignoreInitial: _this.ignoreInitial, ignored: /[\/\\]\./, persistent: true });
            watcher.on('all', (function (action, path) {
                if (action === 'add') {
                    Winston.info('filestore: new file found : ' + path);
                    _this.openResourceFile(path);
                }
                if (action === 'unlink') {
                    _this.closeResourceFile(path);
                }
                if (action === 'change') {
                }
            }));
        }, 2000);
    };
    // Create a debounce function for each layer
    FileStorage.prototype.saveLayerDelay = function (layer) {
        var _this = this;
        if (!layer || !layer.id) {
            Winston.error("saveLayerDelay: Layer id not found");
        }
        if (!this.layerDebounceFunctions.hasOwnProperty(layer.id)) {
            this.layerDebounceFunctions[layer.id] = _.debounce(function (layer) {
                _this.saveLayerFile(layer);
            }, 1000);
        }
        this.layerDebounceFunctions[layer.id].call(this, layer);
    };
    FileStorage.prototype.getProjectFilename = function (projectId) {
        return path.join(this.projectsPath, projectId + '.json');
    };
    FileStorage.prototype.getLayerFilename = function (layerId) {
        return path.join(this.layersPath, layerId + '.json');
    };
    FileStorage.prototype.getLayerBackupFilename = function (layerId) {
        return path.join(this.layersBackupPath, layerId + '-' + new Date().getTime() + '.json');
    };
    FileStorage.prototype.getKeyFilename = function (keyId) {
        return path.join(this.keysPath, keyId + '.json');
    };
    // private getResourceFilename(re: ResourceFile) {
    //     console.log('!!! resource file loc:' + re._localFile);
    //     return re._localFile;
    //     //return path.join(this.resourcesPath, resId + '.json');
    // }
    FileStorage.prototype.getResourceFilename = function (re) {
        //console.log('!!! resource file loc:' + re._localFile);
        //return re._localFile;
        return path.join(this.resourcesPath, re.id + '.json');
    };
    FileStorage.prototype.saveKeyFile = function (key) {
        var fn = this.getKeyFilename(key.id);
        fs.outputFile(fn, JSON.stringify(key), function (error) {
            if (error) {
                Winston.error('filestore: error writing key-file : ' + fn + error.message);
            }
            else {
                Winston.info('filestore: file saved : ' + fn);
            }
        });
    };
    FileStorage.prototype.saveResourceFile = function (res) {
        var fn = this.getResourceFilename(res);
        if (res && !_.isEmpty(res)) {
            fs.outputFile(fn, JSON.stringify(res, null, 2), function (error) {
                if (error) {
                    Winston.error('filestore: error writing resourcefile : ' + fn);
                }
                else {
                    Winston.info('filestore: file saved : ' + fn);
                }
            });
        }
    };
    /** Save project file to disk */
    FileStorage.prototype.saveProjectFile = function (project) {
        var fn = project._localFile;
        if (!fn) {
            fn = this.getProjectFilename(project.id);
        }
        Winston.info('writing project file : ' + fn);
        fs.writeFile(fn, JSON.stringify(project, null, 4), function (error) {
            if (error) {
                Winston.info('error writing project file : ' + fn);
            }
            else {
                Winston.info('filestore: file saved : ' + fn);
            }
        });
    };
    /** save media file */
    FileStorage.prototype.saveBase64 = function (media) {
        var binaryData = new Buffer(media.base64, 'base64');
        fs.writeFile(media.fileUri, binaryData, { encoding: 'base64' }, function (error) {
            if (error) {
                Winston.error('filestore: error writing base64-file : ' + media.fileUri + ' (err: ' + error + ')');
            }
            else {
                Winston.info('filestore: file saved : ' + media.fileUri);
            }
        });
    };
    FileStorage.prototype.saveLayerFile = function (layer) {
        try {
            var fn = this.getLayerFilename(layer.id);
            fs.writeFile(fn, JSON.stringify(layer, null, 2), function (error) {
                if (error) {
                    Winston.info('error writing file : ' + fn);
                }
                else {
                    Winston.info('filestore: file saved : ' + fn);
                }
            });
            if (layer.type === 'dynamicgeojson') {
                var backup = this.getLayerBackupFilename(layer.id);
                fs.writeFile(backup, JSON.stringify(layer, null, 2), function (error) {
                    if (error) {
                        Winston.info('error writing file : ' + backup);
                    }
                    else {
                        Winston.info('filestore: file saved : ' + backup);
                    }
                });
            }
        }
        catch (e) {
            Winston.error('Error writing layer ' + layer.title + ':' + e);
        }
    };
    FileStorage.prototype.getProjectId = function (fileName) {
        return path.basename(fileName).toLowerCase().replace('.json', '');
    };
    FileStorage.prototype.getKeyId = function (fileName) {
        return path.basename(fileName).toLowerCase().replace('.json', '');
    };
    FileStorage.prototype.getResourceId = function (fileName) {
        return path.basename(fileName).toLowerCase().replace('.json', '');
    };
    FileStorage.prototype.getLayerId = function (fileName) {
        return path.basename(fileName).toLowerCase().replace('.json', '');
    };
    FileStorage.prototype.closeLayerFile = function (fileName) {
        var id = this.getLayerId(fileName);
        this.manager.deleteLayer(id, {}, function () { });
    };
    FileStorage.prototype.closeKeyFile = function (fileName) {
    };
    FileStorage.prototype.closeResourceFile = function (fileName) {
    };
    FileStorage.prototype.closeProjectFile = function (fileName) {
        var id = this.getProjectId(fileName);
        this.manager.deleteProject(id, {}, function () { });
    };
    FileStorage.prototype.fetchLayer = function (layerId) {
        var fileName = this.getLayerFilename(layerId);
        var data = fs.readFileSync(fileName, 'utf8');
        if (!data) {
            Winston.warn("Error reading file " + fileName);
            return null;
        }
        var layer;
        try {
            layer = JSON.parse(data);
        }
        catch (e) {
            Winston.warn("Error parsing file: " + fileName + ". Skipped. (Data length: " + ((data) ? data.length : 0) + ")");
            return null;
        }
        layer.storage = this.id;
        layer.id = layerId;
        return layer;
    };
    FileStorage.prototype.openLayerFile = function (fileName) {
        var _this = this;
        if ((fileName.indexOf('.backup')) > 0)
            return;
        var id = this.getLayerId(fileName);
        Winston.info('filestore: openfile ' + id);
        fs.readFile(fileName, 'utf8', function (err, data) {
            if (!err) {
                var layer;
                try {
                    layer = JSON.parse(data);
                }
                catch (e) {
                    Winston.warn("Error parsing file: " + fileName + ". Skipped. (Data length: " + ((data) ? data.length : 0) + ")");
                    return;
                }
                layer.storage = _this.id;
                layer.id = id;
                // this.layers[id] = layer;
                //layer.title = id;
                layer.storage = _this.id;
                //layer.type = "geojson";
                layer.url = '/api/layers/' + id;
                (layer.storage) ? Winston.debug('storage ' + layer.storage) : Winston.warn("No storage found for " + layer);
                _this.manager && _this.manager.addUpdateLayer(layer, {}, function () { });
            }
        });
        if (path.basename(fileName) === 'project.json')
            return;
    };
    FileStorage.prototype.openKeyFile = function (fileName) {
        var _this = this;
        var id = this.getKeyId(fileName);
        Winston.info('filestore: openfile ' + id);
        if (!this.keys.hasOwnProperty(id)) {
            fs.readFile(fileName, 'utf8', function (err, data) {
                if (!err && data && data.indexOf('{') >= 0) {
                    var key = JSON.parse(data);
                    key.storage = _this.id;
                    key.id = id;
                    _this.keys[id] = key;
                    _this.manager.addKey(key, { source: _this.id }, function () { });
                }
            });
        }
    };
    FileStorage.prototype.openResourceFile = function (fileName) {
        var _this = this;
        var id = this.getResourceId(fileName);
        console.log('!! open resource file : ' + fileName + ' (' + id + ')');
        Winston.info('filestore: openfile ' + id);
        if (!this.resources.hasOwnProperty(id)) {
            fs.readFile(fileName, 'utf8', function (err, data) {
                if (!err && data && data.length > 0) {
                    var res = JSON.parse(data.removeBOM());
                    res._localFile = fileName;
                    res.id = id;
                    _this.resources[id] = res;
                    _this.manager && _this.manager.addResource(res, false, { source: _this.id }, function () { });
                    _this.saveResourceFile(res);
                }
            });
        }
    };
    FileStorage.prototype.openProjectFile = function (fileName, id, isDynamic) {
        var _this = this;
        if (!id)
            id = this.getProjectId(fileName);
        Winston.info('filestore: openfile ' + fileName);
        fs.readFile(fileName, 'utf8', function (err, data) {
            if (!err && data && data.length > 0) {
                var project = JSON.parse(data);
                project._localFile = fileName;
                if (typeof project.id === 'undefined') {
                    project.id = id || helpers.newGuid();
                    _this.manager.getProjectId(project);
                    _this.saveProjectFile(project);
                }
                if (!_this.projects.hasOwnProperty(project.id)) {
                    id = project.id;
                    //var proj = this.manager.getProjectDefinition(project);
                    _this.projects[id] = project;
                    project.storage = _this.id;
                    //console.log(JSON.stringify(project));
                    // project.id = id;
                    // project.title = id;
                    // project.groups = [];
                    // project.logo = "";
                    if (typeof isDynamic !== 'undefined')
                        project.isDynamic = isDynamic;
                    project.url = '/api/projects/' + id;
                    _this.manager && _this.manager.updateProject(project, {}, function () { });
                }
            }
            else if (err) {
                Winston.error('Error reading file: ' + id + '(' + err.message + ')');
            }
        });
        //if (path.basename(fileName) === 'project.json') {return;}
    };
    /**
     * Find layer for a specific layerId (can return null)
     */
    FileStorage.prototype.findLayer = function (layerId) {
        if (this.layers.indexOf(layerId) >= 0) {
            return this.fetchLayer(layerId);
        }
        else {
            return null;
        }
        ;
    };
    FileStorage.prototype.addProject = function (project, meta, callback) {
        try {
            this.projects[project.id] = project;
            this.saveProjectDelay(project);
            callback({ result: ApiResult.OK, project: project });
        }
        catch (e) {
            callback({ result: ApiResult.OK, error: null });
        }
    };
    FileStorage.prototype.getProject = function (projectId, meta, callback) {
        var _this = this;
        if (this.projects.hasOwnProperty(projectId)) {
            callback({ result: ApiResult.OK, project: this.projects[projectId] });
        }
        else {
            var filename_1 = path.join(this.projectsPath, projectId + '.json');
            fs.exists(filename_1, function (exists) {
                if (!exists) {
                    return callback({ result: ApiResult.ProjectNotFound });
                }
                fs.readFile(filename_1, 'utf8', function (err, data) {
                    if (err) {
                        return callback({ result: ApiResult.ProjectNotFound });
                    }
                    _this.projects[projectId] = JSON.parse(data);
                    callback({ result: ApiResult.OK, project: _this.projects[projectId] });
                });
            });
        }
    };
    FileStorage.prototype.updateProject = function (project, meta, callback) {
        if (this.projects.hasOwnProperty(project.id)) {
            this.projects[project.id] = project;
            this.saveProjectDelay(project);
            Winston.info('Added project ' + project.id + ' to FileStorage projects');
            callback({ result: ApiResult.OK, project: null });
        }
        else {
            callback({ result: ApiResult.Error });
        }
    };
    // layer methods first, in crud order.
    FileStorage.prototype.addLayer = function (layer, meta, callback) {
        try {
            if (this.layers.indexOf(layer.id) < 0) {
                this.layers.push(layer.id);
            }
            this.saveLayerDelay(layer);
            callback({ result: ApiResult.OK });
        }
        catch (e) {
            callback({ result: ApiResult.OK, error: null });
        }
    };
    FileStorage.prototype.getLayer = function (layerId, meta, callback) {
        if (this.layers.indexOf(layerId) >= 0) {
            var l = this.fetchLayer(layerId);
            if (l) {
                callback({ result: ApiResult.OK, layer: l });
                return;
            }
            else {
                Winston.warn("Layer " + layerId + " is empty");
            }
        }
        callback({ result: ApiResult.LayerNotFound });
    };
    FileStorage.prototype.updateLayer = function (layer, meta, callback) {
        if (this.layers.indexOf(layer.id) >= 0) {
            this.saveLayerDelay(layer);
            Winston.info('FileStorage: updated layer ' + layer.id);
            callback({ result: ApiResult.OK, layer: null });
        }
        else {
            callback({ result: ApiResult.Error });
        }
    };
    FileStorage.prototype.deleteLayer = function (layerId, meta, callback) {
        if (this.layers.hasOwnProperty(layerId)) {
            this.layers = this.layers.filter(function (l) { return l !== layerId; });
            var fn = this.getLayerFilename(layerId);
            fs.unlink(fn, function (err) {
                if (err) {
                    Winston.error('File: Error deleting ' + fn + ' (' + err.message + ')');
                }
                else {
                    Winston.info('File: deleted: ' + fn);
                }
            });
            callback({ result: ApiResult.OK, layer: null });
        }
        else {
            callback({ result: ApiResult.Error });
        }
    };
    FileStorage.prototype.searchLayer = function (layerId, keyWord, meta, callback) {
        Winston.error('search request:' + layerId + ' (' + keyWord + ')');
        var result = [];
        callback({ result: ApiResult.OK, features: result });
    };
    // feature methods, in crud order
    FileStorage.prototype.addFeature = function (layerId, feature, meta, callback) {
        var layer = this.findLayer(layerId);
        if (layer) {
            // check if id doesn't exist
            if (!layer.features.some(function (f) { return f.id === feature.id; })) {
                layer.features.push(feature);
                this.saveLayerDelay(layer);
                callback({ result: ApiResult.OK, layer: null });
            }
            else {
                Winston.error('filestorage: add feature: feature id already exists');
                callback({ result: ApiResult.Error, error: 'Feature ID already exists' });
            }
        }
        else {
            callback({ result: ApiResult.Error });
        }
    };
    FileStorage.prototype.updateProperty = function (layerId, featureId, property, value, useLog, meta, callback) { };
    FileStorage.prototype.updateLogs = function (layerId, featureId, logs, meta, callback) {
        var f;
        var layer = this.findLayer(layerId);
        layer.features.some(function (feature) {
            if (!feature.id || feature.id !== featureId)
                return false;
            // feature found
            f = feature;
            return true;
        });
        if (!f) {
            callback({ result: ApiResult.Error });
            return; // feature not found
        }
        if (!f.hasOwnProperty('logs'))
            f.logs = {};
        if (!f.hasOwnProperty('properties'))
            f.properties = {};
        // apply changes
        for (var key in logs) {
            if (!f.logs.hasOwnProperty(key))
                f.logs[key] = [];
            logs[key].forEach(function (l) {
                delete l.prop;
                f.logs[key].push(l);
                if (key !== '~geometry')
                    f.properties[key] = l.value;
            });
            // send them to other clients
            //
        }
        this.saveLayerDelay(layer);
        callback({ result: ApiResult.OK, layer: null });
    };
    FileStorage.prototype.getFeature = function (layerId, featureId, meta, callback) {
        var found = false;
        var l = this.findLayer(layerId);
        if (l) {
            l.features.some(function (f) {
                if (f.id === featureId) {
                    found = true;
                    callback({ result: ApiResult.OK, feature: f });
                    return true;
                }
            });
        }
        if (!found)
            callback({ result: ApiResult.Error });
    };
    //TODO: implement
    FileStorage.prototype.updateFeature = function (layerId, feature, useLog, meta, callback) {
        var layer = this.findLayer(layerId);
        if (!layer) {
            callback({ result: ApiResult.LayerNotFound, layer: null });
            return;
        }
        if (!layer.features) {
            callback({ result: ApiResult.FeatureNotFound, layer: null });
            return;
        }
        var f = layer.features.filter(function (k) { return k.id && k.id === feature.id; });
        if (f && f.length > 0) {
            var index = layer.features.indexOf(f[0]);
            layer.features[index] = feature;
        }
        else {
            layer.features.push(feature);
        }
        this.saveLayerDelay(layer);
        Winston.info('filestore: update feature');
        callback({ result: ApiResult.OK, layer: null });
    };
    //TODO: test further. Result is the # of deleted docs.
    FileStorage.prototype.deleteFeature = function (layerId, featureId, meta, callback) {
        var layer = this.findLayer(layerId);
        if (layer && layer.features) {
            layer.features = layer.features.filter(function (k) { return k.id && k.id !== featureId; });
            this.saveLayerDelay(layer);
        }
        callback({ result: ApiResult.OK });
    };
    /** Add a file: images go to the iconPath folder, others to the blob folder */
    FileStorage.prototype.addFile = function (base64, folder, file, meta, callback) {
        var ext = path.extname(file).toLowerCase();
        var fileUri = file.split('/').pop(); // retreive the file name
        switch (ext) {
            case '.png':
            case '.jpg':
            case '.gif':
            case '.jpeg':
            case '.tif':
            case '.tiff':
                fileUri = path.join(this.iconPath, fileUri);
                break;
            default:
                fileUri = path.join(this.blobPath, fileUri);
                break;
        }
        var media = { base64: base64, fileUri: fileUri };
        this.saveBase64(media);
        callback({ result: ApiResult.OK });
    };
    FileStorage.prototype.addResource = function (res, meta, callback) {
        if (!res.id)
            res.id = helpers.newGuid();
        if (!res.propertyTypeData)
            res.propertyTypeData = {};
        if (!res.featureTypes)
            res.featureTypes = {};
        this.resources[res.id] = res;
        this.saveResourcesDelay(res);
        callback({ result: ApiResult.OK });
    };
    FileStorage.prototype.addPropertyTypes = function (resourceId, data, meta, callback) {
        if (!this.resources.hasOwnProperty(resourceId) || !data || !_.isArray(data)) {
            callback({ result: ApiResult.ResourceNotFound });
            return;
        }
        var resource = this.resources[resourceId];
        var ptKeys = '';
        data.forEach(function (pt) {
            if (resource.propertyTypeData.hasOwnProperty(pt.label))
                return;
            resource.propertyTypeData[pt.label] = pt;
            ptKeys += ";" + pt.label;
        });
        _.each(resource.featureTypes, function (ft) {
            if (ft.propertyTypeKeys)
                ft.propertyTypeKeys += ptKeys;
        });
        this.saveResourcesDelay(resource);
        callback({ result: ApiResult.OK });
    };
    /** Get a resource file  */
    FileStorage.prototype.getResource = function (resourceId, meta, callback) {
        if (this.resources.hasOwnProperty(resourceId)) {
            callback({ result: ApiResult.OK, resource: this.resources[resourceId] });
        }
        else {
            callback({ result: ApiResult.ResourceNotFound });
        }
    };
    FileStorage.prototype.addKey = function (key, meta, callback) {
        if (!key.id)
            key.id = helpers.newGuid();
        if (!key.values)
            key.values = [];
        this.keys[key.id] = key;
        this.saveKeyDelay(key);
        callback({ result: ApiResult.OK });
    };
    FileStorage.prototype.getKey = function (keyId, meta, callback) {
        if (this.keys.hasOwnProperty(keyId)) {
            var k = this.keys[keyId];
            callback({ result: ApiResult.OK, key: k });
        }
        else {
            callback({ result: ApiResult.KeyNotFound });
        }
    };
    FileStorage.prototype.updateKey = function (keyId, value, meta, callback) {
        if (!this.keys.hasOwnProperty(keyId))
            this.addKey({ id: keyId, storage: '' }, meta, function () { });
        var k = this.keys[keyId];
        if (k != null) {
            k.values.push(value);
        }
        if (k.storage === 'file')
            this.saveKeyDelay(k);
    };
    //TODO: Move connection set-up params from static to parameterized.
    FileStorage.prototype.init = function (layerManager, options) {
        this.manager = layerManager;
        // set up connection
        Winston.info('filestore: init File Storage');
    };
    return FileStorage;
}(BaseConnector.BaseConnector));
exports.FileStorage = FileStorage;
//# sourceMappingURL=FileStorage.js.map