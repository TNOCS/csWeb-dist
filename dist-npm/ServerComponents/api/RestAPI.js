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
var cors = require("cors");
var Project = ApiManager.Project;
var Group = ApiManager.Group;
var Layer = ApiManager.Layer;
var Feature = ApiManager.Feature;
var ResourceFile = ApiManager.ResourceFile;
var BaseConnector = require("./BaseConnector");
var ApiResult = ApiManager.ApiResult;
var Winston = require("winston");
var request = require("request");
var RestAPI = (function (_super) {
    __extends(RestAPI, _super);
    function RestAPI(server, baseUrl) {
        if (baseUrl === void 0) { baseUrl = '/api'; }
        var _this = _super.call(this) || this;
        _this.server = server;
        _this.baseUrl = baseUrl;
        _this.isInterface = true;
        _this.resourceUrl = baseUrl + '/resources/';
        _this.layersUrl = baseUrl + '/layers/';
        _this.searchUrl = baseUrl + '/search/';
        _this.filesUrl = baseUrl + '/files/';
        _this.keysUrl = baseUrl + '/keys/';
        _this.projectsUrl = baseUrl + '/projects/';
        _this.proxyUrl = baseUrl + '/proxy';
        _this.tilesUrl = baseUrl + '/tiles/';
        return _this;
    }
    RestAPI.prototype.init = function (layerManager, options, callback) {
        var _this = this;
        this.manager = layerManager;
        console.log('Init Rest API on port ' + this.server.get('port') + '. Base path is ' + this.baseUrl);
        //enables cors, used for external swagger requests
        this.server.use(cors());
        // get all resource types
        this.server.get(this.resourceUrl, function (req, res) {
            res.send(JSON.stringify(_this.cloneWithoutUnderscore(_this.manager.resources)));
        });
        /** add a new resource type file, returns an error if it already exists */
        this.server.post(this.resourceUrl, function (req, res) {
            var resource = new ResourceFile();
            resource = req.body;
            _this.manager.addResource(resource, false, { source: 'rest' }, function (result) {
                res.sendStatus(result.result);
            });
        });
        /** update/add a resource type file, overwrites if it already exists */
        this.server.put(this.resourceUrl, function (req, res) {
            var resource = new ResourceFile();
            resource = req.body;
            _this.manager.addResource(resource, true, { source: 'rest' }, function (result) {
                res.sendStatus(result.result);
            });
        });
        // get an existing resource type file
        this.server.get(this.resourceUrl + ':resourceId', function (req, res) {
            _this.manager.getResource(req.params.resourceId, { source: 'rest' }, function (result) {
                if (result.result === ApiResult.OK) {
                    res.send(_this.cloneWithoutUnderscore(result.resource));
                }
                else {
                    res.sendStatus(result.result);
                }
            });
            //res.send(JSON.stringify(this.manager.getResource(req.params.resourceId.toLowerCase())));
        });
        // get all available public layers
        this.server.get(this.layersUrl, function (req, res) {
            res.send(JSON.stringify(_this.manager.layers));
        });
        //------ Project API paths, in CRUD order
        // get all available projects
        this.server.get(this.projectsUrl, function (req, res) {
            res.send(JSON.stringify(_this.manager.projects));
        });
        // create a new project
        this.server.post(this.projectsUrl, function (req, res) {
            var project = new Project();
            project = req.body;
            _this.manager.addProject(project, { source: 'rest' }, function (result) {
                if (result.result === ApiResult.OK || result.result === ApiResult.ProjectAlreadyExists) {
                    res.send(result.project);
                }
            });
        });
        // gets the entire project
        this.server.get(this.projectsUrl + ':projectId', function (req, res) {
            _this.manager.getProject(req.params.projectId, { source: 'rest' }, function (result) {
                if (result.result === ApiResult.OK) {
                    res.send(result.project);
                }
                else {
                    res.sendStatus(result.result);
                }
            });
        });
        //Updates EVERY layer in the project.
        this.server.put(this.projectsUrl + ':projectId', function (req, res) {
            req.projectId = req.params.projectId;
            _this.manager.updateProject(req.body, { source: 'rest' }, function (result) {
                //todo: check error
                res.sendStatus(result.result);
            });
        });
        // gets the entire layer, which is stored as a single collection
        // TODO: what to do when this gets really big? Offer a promise?
        this.server.delete(this.projectsUrl + ':projectId', function (req, res) {
            _this.manager.deleteProject(req.params.projectId, { source: 'rest' }, function (result) {
                //todo: check error
                res.sendStatus(result.result);
            });
        });
        //adds a layer to a project
        this.server.post(this.projectsUrl + ':projectId/group/:groupId/layer/:layerId', function (req, res) {
            _this.manager.addLayerToProject(req.params.projectId, req.params.groupId, req.params.layerId, { source: 'rest' }, function (result) {
                res.sendStatus(result.result);
            });
        });
        //removes a layer from a project
        this.server.delete(this.projectsUrl + ':projectId/group/:groupId/layer/:layerId', function (req, res) {
            _this.manager.removeLayerFromProject(req.params.projectId, req.params.groupId, req.params.layerId, { source: 'rest' }, function (result) {
                res.sendStatus(result.result);
            });
        });
        this.server.get(this.projectsUrl + ':projectId/group/', function (req, res) {
            _this.manager.allGroups(req.params.projectId, { source: 'rest' }, function (result) {
                //todo: check error
                if (result.result === ApiResult.OK) {
                    res.send(result.groups);
                }
                else {
                    res.sendStatus(result.result);
                }
            });
        });
        this.server.post(this.projectsUrl + ':projectId/group/', function (req, res) {
            var group = new Group();
            group = req.body;
            _this.manager.addGroup(group, req.params.projectId, { source: 'rest' }, function (result) {
                res.sendStatus(result.result);
            });
        });
        this.server.delete(this.projectsUrl + ':projectId/group/:groupId', function (req, res) {
            _this.manager.removeGroup(req.params.groupId, req.params.projectId, { source: 'rest' }, function (result) {
                res.sendStatus(result.result);
            });
        });
        //------ layer API paths, in CRUD order
        // Or post to a layer collection that should be shielded-off (e.g. system or users)
        // And what if an agent starts sending gibberish?
        this.server.post(this.layersUrl, function (req, res) {
            var layer = new Layer();
            //layer.features = req.body.features;
            layer = req.body;
            _this.manager.addUpdateLayer(layer, { source: 'rest' }, function (result) {
                res.sendStatus(result.result);
            });
        });
        // gets the entire layer, which is stored as a single collection
        // TODO: what to do when this gets really big? Offer a promise?
        this.server.get(this.layersUrl + ':layerId', function (req, res) {
            _this.manager.getLayer(req.params.layerId, { source: 'rest' }, function (result) {
                //todo: check error
                if (result.result === ApiResult.OK) {
                    res.send(result.layer);
                }
                else {
                    res.sendStatus(result.result);
                }
            });
        });
        //Updates EVERY feature in the layer.
        this.server.put(this.layersUrl + ':layerId', function (req, res) {
            req.layerId = req.params.layerId;
            _this.manager.addUpdateLayer(req.body, { source: 'rest' }, function (result) {
                //todo: check error
                res.sendStatus(result.result);
            });
        });
        /** creates a new layer, returns an error if it already exists */
        this.server.post(this.layersUrl + ':layerId', function (req, res) {
            req.layerId = req.params.layerId;
            if (_this.manager.layers.hasOwnProperty(req.layerId)) {
                res.sendStatus(ApiResult.LayerAlreadyExists);
            }
            else {
                _this.manager.addUpdateLayer(req.body, { source: 'rest' }, function (result) {
                    //todo: check error
                    res.sendStatus(result.result);
                });
            }
        });
        // gets the entire layer, which is stored as a single collection
        // TODO: what to do when this gets really big? Offer a promise?
        this.server.delete(this.layersUrl + ':layerId', function (req, res) {
            _this.manager.deleteLayer(req.params.layerId, { source: 'rest' }, function (result) {
                //todo: check error
                res.sendStatus(result.result);
            });
        });
        //------ feature API paths, in CRUD order
        //adds a feature
        this.server.post(this.layersUrl + ':layerId/feature', function (req, res) {
            _this.manager.addFeature(req.params.layerId, req.body, { source: 'rest' }, function (result) {
                //todo: check error
                res.send(result);
            });
        });
        //returns a feature
        this.server.get(this.layersUrl + ':layerId/feature/:featureId', function (req, res) {
            _this.manager.getFeature(req.params.layerId, req.params.featureId, { source: 'rest' }, function (result) {
                //todo: check error
                res.sendStatus(result.result);
            });
        });
        // updates a feature corresponding to a query on ID (should be one)
        // Takes a feature as input in the body of the PUT request
        this.server.put(this.layersUrl + ':layerId/feature/:featureId', function (req, res) {
            var feature = new Feature();
            feature = req.body;
            _this.manager.updateFeature(req.params.layerId, feature, { source: 'rest' }, function (result) {
                //todo: check error
                res.send(result);
            });
        });
        // for some reason (TS?) express doesn't work with del as http verb
        // unlike the JS version, which simply uses del as a keyword.
        // deletes a feature
        this.server.delete(this.layersUrl + ':layerId/feature/:featureId', function (req, res) {
            _this.manager.deleteFeature(req.params.layerId, req.params.featureId, { source: 'rest' }, function (result) {
                //todo: check error
                res.send(result);
            });
        });
        this.server.get(this.searchUrl + ':keyword', function (req, res) {
            _this.manager.searchLayers(req.params.keyword, [], { source: 'rest' }, function (result) {
                //todo: check error
                res.send(result);
            });
        });
        // LOGS
        // addLog
        this.server.put(this.layersUrl + ':layerId/:featureId/log', function (req, res) {
            _this.manager.addLog(req.params.layerId, req.params.featureId, req.body.prop, req.body, { source: 'rest' }, function (result) {
                //todo: check error
                console.log('received log');
                res.send(result);
            });
        });
        //getLog (path doesnt make sense)
        this.server.get(this.layersUrl + ':layerId/:featureId/log', function (req, res) {
            _this.manager.getLog(req.params.layerId, req.params.featureId, { source: 'rest' }, function (result) {
                //todo: check error
                res.send(result);
            });
        });
        //deleteLog
        this.server.delete(this.layersUrl + ':layerId/:featureId/log', function (req, res) {
            _this.manager.deleteLog(req.params.layerId, req.params.featureId, req.body.ts, req.body.prop, { source: 'rest' }, function (result) {
                //todo: check error
                res.send(result);
            });
        });
        // updates all features corresponding to query on ID (should be one)
        this.server.put(this.layersUrl + ':layerId/:featureId/logs', function (req, res) {
            var logs;
            logs = req.body;
            _this.manager.updateLogs(req.params.layerId, req.params.featureId, logs, { source: 'rest' }, function (result) {
                //todo: check error
                res.send(result);
            });
        });
        // Some geospatial queries that are only supported for mongo.
        // We chose to work with GET and params here for ease of accessibility
        // (majority of web APIs implement similar constructions)
        // gets all points in a rectangular shape.
        this.server.get(this.layersUrl + ':layerId/bbox', function (req, res) {
            var southWest = [Number(req.query.swlng), Number(req.query.swlat)];
            var northEast = [Number(req.query.nelng), Number(req.query.nelat)];
            _this.manager.getBBox(req.params.layerId, southWest, northEast, { source: 'rest' }, function (result) {
                //todo: check error
                res.send(result);
            });
        });
        // fetches all points in a spherical method
        this.server.get(this.layersUrl + ':layerId/getsphere', function (req, res) {
            _this.manager.getSphere(req.params.layerId, Number(req.query.maxDistance), Number(req.query.lng), Number(req.query.lat), { source: 'rest' }, function (result) {
                // this.server.post(this.sensorsUrl + ':sensorId', (req: express.Request, res: express.Response) => {
                //     this.manager.addSensor(req.body, (result: CallbackResult) => { res.send(result) });
                // });
                //todo: check error
                res.send(result);
            });
        });
        //works with post - so we can receive a GeoJSON as input
        this.server.post(this.layersUrl + ':layerId/getwithinpolygon', function (req, res) {
            var feature = req.body;
            // this.server.get(this.sensorsUrl, (req: express.Request, res: express.Response) => {
            //     this.manager.getSensors((result: CallbackResult) => { res.send(result) });
            // });
            _this.manager.getWithinPolygon(req.params.layerId, feature, { source: 'rest' }, function (result) {
                //todo: check error
                res.send(result);
            });
        });
        //update a key
        this.server.post(this.keysUrl + ':keyId', function (req, res) {
            _this.manager.updateKey(req.params.keyId, req.body, { source: 'rest' }, function (result) {
                //todo: check error
                res.send(result);
            });
        });
        //get all keys
        this.server.get(this.keysUrl, function (req, res) {
            _this.manager.getKeys({ source: 'rest' }, function (result) {
                //todo: check error
                res.send(result.keys);
            });
        });
        //get a key
        this.server.get(this.keysUrl + ':keyId', function (req, res) {
            _this.manager.getKey(req.params.keyId, { source: 'rest' }, function (result) {
                res.send(result.key);
            });
        });
        //add file
        this.server.post(this.filesUrl + ':folderId/:fileName', function (req, res) {
            if (!req.body.hasOwnProperty('base64')) {
                Winston.error('Error receiving base64 encoded image: post the data as JSON, with the base64 property set to the base64 encoded string!');
                return;
            }
            _this.manager.addFile(req.body['base64'], req.params.folderId, req.params.fileName, { source: 'rest' }, function (result) {
                //todo: check error
                res.send(result);
            });
        });
        // proxy service
        this.server.get(this.proxyUrl, function (req, res) {
            var id = req.query.url;
            console.log(id);
            _this.getUrl(id, req, res);
        });
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