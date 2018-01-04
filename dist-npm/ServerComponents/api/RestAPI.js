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
var express_1 = require("express");
var ApiManager = require("./ApiManager");
var Project = ApiManager.Project;
var Group = ApiManager.Group;
var Layer = ApiManager.Layer;
var Feature = ApiManager.Feature;
var ResourceFile = ApiManager.ResourceFile;
var BaseConnector = require("./BaseConnector");
var ApiResult = ApiManager.ApiResult;
var Winston = require("winston");
var request = require("request");
var RestAPI = /** @class */ (function (_super) {
    __extends(RestAPI, _super);
    function RestAPI(server, baseUrl) {
        if (baseUrl === void 0) { baseUrl = '/api'; }
        var _this = _super.call(this) || this;
        _this.server = server;
        _this.baseUrl = baseUrl;
        _this.isInterface = true;
        _this.resourceUrl = '/resources/';
        _this.layersUrl = '/layers/';
        _this.searchUrl = '/search/';
        _this.filesUrl = '/files/';
        _this.keysUrl = '/keys/';
        _this.projectsUrl = '/projects/';
        _this.proxyUrl = '/proxy';
        _this.tilesUrl = '/tiles/';
        return _this;
    }
    RestAPI.prototype.getResources = function (req, res) {
        res.json(this.cloneWithoutUnderscore(this.manager.resources));
    };
    RestAPI.prototype.getTheResource = function (req, res) {
        var _this = this;
        this.manager.getResource(req.params.resourceId, { source: 'rest' }, function (result) {
            if (result.result === ApiResult.OK) {
                res.json(_this.cloneWithoutUnderscore(result.resource));
            }
            else {
                res.sendStatus(result.result);
            }
        });
    };
    RestAPI.prototype.createTheResource = function (req, res) {
        var resource = new ResourceFile();
        resource = req.body;
        this.manager.addResource(resource, false, { source: 'rest' }, function (result) {
            res.sendStatus(result.result);
        });
    };
    RestAPI.prototype.updateTheResource = function (req, res) {
        var resource = new ResourceFile();
        resource = req.body;
        this.manager.addResource(resource, true, { source: 'rest' }, function (result) {
            res.sendStatus(result.result);
        });
    };
    RestAPI.prototype.getLayers = function (req, res) {
        res.json(this.manager.layers);
    };
    RestAPI.prototype.getTheProjects = function (req, res) {
        res.json(this.manager.projects);
    };
    RestAPI.prototype.getTheProject = function (req, res) {
        this.manager.getProject(req.params.projectId, { source: 'rest' }, function (result) {
            if (result.result === ApiResult.OK) {
                res.json(result.project);
            }
            else {
                res.sendStatus(result.result);
            }
        });
    };
    RestAPI.prototype.updateTheProject = function (req, res) {
        req['projectId'] = req.params.projectId;
        this.manager.updateProject(req.body, { source: 'rest' }, function (result) {
            //todo: check error
            res.sendStatus(result.result);
        });
    };
    RestAPI.prototype.createTheProject = function (req, res) {
        var project = new Project();
        project = req.body;
        this.manager.addProject(project, { source: 'rest' }, function (result) {
            if (result.result === ApiResult.OK || result.result === ApiResult.ProjectAlreadyExists) {
                res.json(result.project);
            }
        });
    };
    RestAPI.prototype.deleteTheProject = function (req, res) {
        this.manager.deleteProject(req.params.projectId, { source: 'rest' }, function (result) {
            //todo: check error
            res.sendStatus(result.result);
        });
    };
    RestAPI.prototype.addTheLayer = function (req, res) {
        this.manager.addLayerToProject(req.params.projectId, req.params.groupId, req.params.layerId, { source: 'rest' }, function (result) {
            res.sendStatus(result.result);
        });
    };
    RestAPI.prototype.deleteTheLayer = function (req, res) {
        this.manager.removeLayerFromProject(req.params.projectId, req.params.groupId, req.params.layerId, { source: 'rest' }, function (result) {
            res.sendStatus(result.result);
        });
    };
    RestAPI.prototype.deleteTheLayer2 = function (req, res) {
        this.manager.deleteLayer(req.params.layerId, { source: 'rest' }, function (result) {
            //todo: check error
            res.sendStatus(result.result);
        });
    };
    RestAPI.prototype.getTheGroups = function (req, res) {
        this.manager.allGroups(req.params.projectId, { source: 'rest' }, function (result) {
            //todo: check error
            if (result.result === ApiResult.OK) {
                res.send(result.groups);
            }
            else {
                res.sendStatus(result.result);
            }
        });
    };
    RestAPI.prototype.createTheGroup = function (req, res) {
        var group = new Group();
        group = req.body;
        this.manager.addGroup(group, req.params.projectId, { source: 'rest' }, function (result) {
            res.sendStatus(result.result);
        });
    };
    RestAPI.prototype.updateTheGroup = function (req, res) {
        this.manager.updateGroup(req.params.projectId, req.params.groupId, req.body, { source: 'rest' }, function (result) {
            res.sendStatus(result.result);
        });
    };
    RestAPI.prototype.deleteTheGroup = function (req, res) {
        this.manager.removeGroup(req.params.groupId, req.params.projectId, { source: 'rest' }, function (result) {
            res.sendStatus(result.result);
        });
    };
    RestAPI.prototype.createTheLayer = function (req, res) {
        var layer = new Layer();
        //layer.features = req.body.features;
        layer = req.body;
        this.manager.addUpdateLayer(layer, { source: 'rest' }, function (result) {
            res.sendStatus(result.result);
        });
    };
    /** Similar to createLayer, but also checks if a layer exists: Should probably be removed as it is an update! */
    RestAPI.prototype.createTheLayer2 = function (req, res) {
        Winston.warn('DEPRECATED - USE PUT TO UPDATE A LAYER');
        req['layerId'] = req.params.layerId;
        if (this.manager.layers.hasOwnProperty(req['layerId'])) {
            res.sendStatus(ApiResult.LayerAlreadyExists);
        }
        else {
            this.manager.addUpdateLayer(req.body, { source: 'rest' }, function (result) {
                //todo: check error
                res.sendStatus(result.result);
            });
        }
    };
    RestAPI.prototype.getTheLayer = function (req, res) {
        this.manager.getLayer(req.params.layerId, { source: 'rest' }, function (result) {
            //todo: check error
            if (result.result === ApiResult.OK) {
                res.json(result.layer);
            }
            else {
                res.sendStatus(result.result);
            }
        });
    };
    RestAPI.prototype.updateTheLayer = function (req, res) {
        req['layerId'] = req.params.layerId;
        this.manager.addUpdateLayer(req.body, { source: 'rest' }, function (result) {
            //todo: check error
            res.sendStatus(result.result);
        });
    };
    RestAPI.prototype.addTheFeature = function (req, res) {
        this.manager.addFeature(req.params.layerId, req.body, { source: 'rest' }, function (result) {
            //todo: check error
            res.send(result);
        });
    };
    RestAPI.prototype.getTheFeature = function (req, res) {
        this.manager.getFeature(req.params.layerId, req.params.featureId, { source: 'rest' }, function (result) {
            //todo: check error
            res.sendStatus(result.result);
        });
    };
    RestAPI.prototype.updateTheFeature = function (req, res) {
        var feature = new Feature();
        feature = req.body;
        this.manager.updateFeature(req.params.layerId, feature, { source: 'rest' }, function (result) {
            //todo: check error
            res.send(result);
        });
    };
    RestAPI.prototype.deleteTheFeature = function (req, res) {
        this.manager.deleteFeature(req.params.layerId, req.params.featureId, { source: 'rest' }, function (result) {
            //todo: check error
            res.send(result);
        });
    };
    RestAPI.prototype.searchLayers = function (req, res) {
        this.manager.searchLayers(req.params.keyword, [], { source: 'rest' }, function (result) {
            //todo: check error
            res.json(result);
        });
    };
    RestAPI.prototype.getLayerFeaturesInBBox = function (req, res) {
        var southWest = [Number(req.query.swlng), Number(req.query.swlat)];
        var northEast = [Number(req.query.nelng), Number(req.query.nelat)];
        this.manager.getBBox(req.params.layerId, southWest, northEast, { source: 'rest' }, function (result) {
            //todo: check error
            res.send(result);
        });
    };
    RestAPI.prototype.getLayerFeaturesInSphere = function (req, res) {
        this.manager.getSphere(req.params.layerId, Number(req.query.maxDistance), Number(req.query.lng), Number(req.query.lat), { source: 'rest' }, function (result) {
            // this.server.post(this.sensorsUrl + ':sensorId', (req: Request, res: Response) => {
            //     this.manager.addSensor(req.body, (result: CallbackResult) => { res.send(result) });
            // });
            //todo: check error
            res.send(result);
        });
    };
    RestAPI.prototype.getLayerFeaturesInPolygon = function (req, res) {
        var feature = req.body;
        // this.server.get(this.sensorsUrl, (req: Request, res: Response) => {
        //     this.manager.getSensors((result: CallbackResult) => { res.send(result) });
        // });
        this.manager.getWithinPolygon(req.params.layerId, feature, { source: 'rest' }, function (result) {
            //todo: check error
            res.send(result);
        });
    };
    RestAPI.prototype.updateTheKey = function (req, res) {
        this.manager.updateKey(req.params.keyId, req.body, { source: 'rest' }, function (result) {
            //todo: check error
            res.send(result);
        });
    };
    RestAPI.prototype.getTheKeys = function (req, res) {
        this.manager.getKeys({ source: 'rest' }, function (result) {
            //todo: check error
            res.send(result.keys);
        });
    };
    RestAPI.prototype.getTheKey = function (req, res) {
        this.manager.getKey(req.params.keyId, { source: 'rest' }, function (result) {
            res.send(result.key);
        });
    };
    RestAPI.prototype.addTheFile = function (req, res) {
        if (!req.body.hasOwnProperty('base64')) {
            Winston.error('Error receiving base64 encoded image: post the data as JSON, with the base64 property set to the base64 encoded string!');
            return;
        }
        this.manager.addFile(req.body['base64'], req.params.folderId, req.params.fileName, { source: 'rest' }, function (result) {
            //todo: check error
            res.send(result);
        });
    };
    RestAPI.prototype.getTheFile = function (req, res) {
        this.manager.getFile(req.params.fileName, { source: 'rest' }, function (result) {
            res.send(result);
        });
    };
    RestAPI.prototype.addTheLogs = function (req, res) {
        var logs;
        logs = req.body;
        this.manager.updateLogs(req.params.layerId, req.params.featureId, logs, { source: 'rest' }, function (result) {
            //todo: check error
            res.send(result);
        });
    };
    RestAPI.prototype.addTheLog = function (req, res) {
        this.manager.addLog(req.params.layerId, req.params.featureId, req.body.prop, req.body, { source: 'rest' }, function (result) {
            //todo: check error
            console.log('received log');
            res.send(result);
        });
    };
    RestAPI.prototype.getTheLog = function (req, res) {
        this.manager.getLog(req.params.layerId, req.params.featureId, { source: 'rest' }, function (result) {
            //todo: check error
            res.send(result);
        });
    };
    RestAPI.prototype.deleteTheLog = function (req, res) {
        this.manager.deleteLog(req.params.layerId, req.params.featureId, req.body.ts, req.body.prop, { source: 'rest' }, function (result) {
            //todo: check error
            res.send(result);
        });
    };
    RestAPI.prototype.getLogs = function (req, res) {
        var logs;
        logs = req.body;
        this.manager.updateLogs(req.params.layerId, req.params.featureId, logs, { source: 'rest' }, function (result) {
            //todo: check error
            res.send(result);
        });
    };
    RestAPI.prototype.proxyTheUrl = function (req, res) {
        var id = req.query.url;
        console.log(id);
        this.getUrl(id, req, res);
    };
    RestAPI.prototype.init = function (layerManager, options, callback) {
        var _this = this;
        this.manager = layerManager;
        console.log('Init Rest API on port ' + this.server.get('port') + '. Base path is ' + this.baseUrl);
        var router = express_1.Router();
        router.route(this.resourceUrl)
            .get(function (req, res) { return _this.getResources(req, res); })
            .put(function (req, res) { return _this.updateTheResource(req, res); })
            .post(function (req, res) { return _this.createTheResource(req, res); });
        router.route(this.resourceUrl + ':resourceId')
            .get(function (req, res) { return _this.getTheResource(req, res); });
        router.route(this.layersUrl)
            .get(function (req, res) { return _this.getLayers(req, res); });
        //------ Project API paths, in CRUD order
        router.route(this.projectsUrl)
            .get(function (req, res) { return _this.getTheProjects(req, res); })
            .post(function (req, res) { return _this.createTheProject(req, res); });
        router.route(this.projectsUrl + ':projectId')
            .get(function (req, res) { return _this.getTheProject(req, res); })
            .put(function (req, res) { return _this.updateTheProject(req, res); })
            .delete(function (req, res) { return _this.deleteTheProject(req, res); });
        router.route(this.projectsUrl + ':projectId/group/')
            .get(function (req, res) { return _this.getTheGroups(req, res); })
            .post(function (req, res) { return _this.createTheGroup(req, res); });
        router.route(this.projectsUrl + ':projectId/group/:groupId')
            .put(function (req, res) { return _this.updateTheGroup(req, res); })
            .delete(function (req, res) { return _this.deleteTheGroup(req, res); });
        router.route(this.projectsUrl + ':projectId/group/:groupId/layer/:layerId')
            .delete(function (req, res) { return _this.deleteTheLayer(req, res); })
            .post(function (req, res) { return _this.addTheLayer(req, res); });
        //------ layer API paths, in CRUD order
        router.route(this.layersUrl)
            .post(function (req, res) { return _this.createTheLayer(req, res); });
        router.route(this.layersUrl + ':layerId')
            .get(function (req, res) { return _this.getTheLayer(req, res); })
            .put(function (req, res) { return _this.updateTheLayer(req, res); })
            .post(function (req, res) { return _this.createTheLayer2(req, res); })
            .delete(function (req, res) { return _this.deleteTheLayer2(req, res); });
        //------ feature API paths, in CRUD order
        router.route(this.layersUrl + ':layerId/feature')
            .post(function (req, res) { return _this.addTheFeature(req, res); });
        router.route(this.layersUrl + ':layerId/feature/:featureId')
            .get(function (req, res) { return _this.getTheFeature(req, res); })
            .put(function (req, res) { return _this.updateTheFeature(req, res); })
            .delete(function (req, res) { return _this.deleteTheFeature(req, res); });
        // LOGS
        // ROUTE should be :layerId/features/:featureId/log
        router.route(this.layersUrl + ':layerId/:featureId/log')
            .get(function (req, res) { return _this.getTheLog(req, res); })
            .put(function (req, res) { return _this.addTheLog(req, res); })
            .delete(function (req, res) { return _this.deleteTheLog(req, res); }); // Shouldn't it be post?
        router.route(this.layersUrl + ':layerId/:featureId/logs')
            .put(function (req, res) { return _this.addTheLogs(req, res); });
        router.route(this.searchUrl + ':keyword')
            .get(function (req, res) { return _this.searchLayers(req, res); });
        router.route(this.layersUrl + ':layerId/bbox')
            .get(function (req, res) { return _this.getLayerFeaturesInBBox(req, res); });
        router.route(this.layersUrl + ':layerId/getsphere')
            .get(function (req, res) { return _this.getLayerFeaturesInSphere(req, res); });
        router.route(this.layersUrl + ':layerId/getwithinpolygon')
            .post(function (req, res) { return _this.getLayerFeaturesInPolygon(req, res); });
        router.route(this.keysUrl)
            .post(function (req, res) { return _this.getTheKeys(req, res); });
        router.route(this.keysUrl + ':keyId')
            .get(function (req, res) { return _this.getTheKey(req, res); })
            .post(function (req, res) { return _this.updateTheKey(req, res); });
        router.route(this.filesUrl + ':folderId/:fileName')
            .post(function (req, res) { return _this.addTheFile(req, res); });
        router.route(this.filesUrl + ':folderId/:fileName')
            .get(function (req, res) { return _this.getTheFile(req, res); });
        router.route(this.proxyUrl)
            .get(function (req, res) { return _this.proxyTheUrl(req, res); });
        this.server.use(this.baseUrl, router);
        callback();
    };
    RestAPI.prototype.getUrl = function (feedUrl, req, res) {
        Winston.info('proxy request 2: ' + feedUrl);
        //feedUrl = 'http://rss.politie.nl/rss/algemeen/ab/algemeen.xml';
        var options = {
            method: 'get',
            headers: req.headers
        };
        var parseNumbers = function (str) {
            if (!isNaN(str)) {
                str = str % 1 === 0 ? parseInt(str, 10) : parseFloat(str);
            }
            return str;
        };
        request(feedUrl, options, function (error, response, xml) {
            if (!error && response.statusCode === 200) {
                res.send(xml);
            }
            else {
                res.statusCode = 404;
                res.end();
            }
        });
    };
    RestAPI.prototype.cloneWithoutUnderscore = function (v) {
        var _this = this;
        if (typeof v !== 'object')
            return v;
        if (v instanceof Array) {
            var a = [];
            v.forEach(function (i) {
                a.push(_this.cloneWithoutUnderscore(i));
            });
            return a;
        }
        else {
            var c = {};
            for (var k in v) {
                if (k[0] !== '_')
                    c[k] = this.cloneWithoutUnderscore(v[k]);
            }
            return c;
        }
    };
    return RestAPI;
}(BaseConnector.BaseConnector));
exports.RestAPI = RestAPI;
//# sourceMappingURL=RestAPI.js.map