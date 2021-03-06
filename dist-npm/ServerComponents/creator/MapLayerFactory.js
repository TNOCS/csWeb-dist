"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var fs = require("fs");
var proj4 = require("proj4");
var IBagOptions = require("../database/IBagOptions");
var Api = require("../api/ApiManager");
var Utils = require("../helpers/Utils");
var async = require("async");
var winston = require("winston");
var path = require("path");
/** A factory class to create new map layers based on input, e.g. from Excel */
var MapLayerFactory = (function () {
    // constructor(private bag: LocalBag, private messageBus: MessageBus.MessageBusService) {
    function MapLayerFactory(bag, messageBus, apiManager, workingDir) {
        if (workingDir === void 0) { workingDir = ''; }
        this.bag = bag;
        this.messageBus = messageBus;
        this.workingDir = workingDir;
        if (bag != null) {
            bag.init();
        }
        var fileList = [];
        var templateFolder = path.join(workingDir, 'public', 'data', 'templates');
        fs.stat(templateFolder, function (err, stats) {
            if (err) {
                return console.error("Template-folder \"" + templateFolder + "\" not found");
            }
            if (!stats.isDirectory()) {
                return winston.info("Template-folder \"" + templateFolder + "\" is not a valid directory");
            }
            fs.readdir(templateFolder, function (err, files) {
                if (err) {
                    return winston.info('Error while looking for templates in ' + templateFolder);
                }
                files.forEach(function (f) {
                    fileList[f.replace(/\.[^/.]+$/, '')] = path.join(templateFolder, f); // Filter extension from key and store in dictionary
                });
                winston.info("Loaded " + files.length + " templates from " + templateFolder + ".");
            });
        });
        this.templateFiles = fileList;
        this.featuresNotFound = {};
        this.apiManager = apiManager;
    }
    MapLayerFactory.prototype.process = function (req, res) {
        var _this = this;
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end('');
        console.log('Received project template. Processing...');
        this.featuresNotFound = {};
        var template = req.body;
        var ld = template.layerDefinition[0];
        this.createMapLayer(template, function (geojson) {
            //if (!fs.existsSync("public/data/projects/DynamicExample")) fs.mkdirSync("public/data/projects/DynamicExample");
            //if (!fs.existsSync("public/data/projects/DynamicExample/" + ld.group)) fs.mkdirSync("public/data/projects/DynamicExample/" + ld.group);
            //fs.writeFileSync("public/data/projects/DynamicExample/" + ld.group + "/" + ld.layerTitle + ".json", JSON.stringify(geojson));
            if (!template.projectId || !ld.reference) {
                console.log('Error: No project or layer ID');
                return;
            }
            var layerId = template.projectId + ld.reference.toLowerCase();
            var data = {
                project: ld.projectTitle,
                projectId: template.projectId,
                layerTitle: ld.layerTitle,
                description: ld.description,
                reference: layerId,
                featureType: layerId,
                opacity: ld.opacity,
                clusterLevel: ld.clusterLevel,
                clustering: ld.useClustering,
                group: ld.group,
                geojson: geojson,
                enabled: ld.isEnabled,
                iconBase64: template.iconBase64,
                geometryFile: ld.geometryFile,
                geometryKey: ld.geometryKey
            };
            if (Object.keys(_this.featuresNotFound).length !== 0) {
                console.log('Adresses that could not be found are:');
                console.log('-------------------------------------');
                for (var key in _this.featuresNotFound) {
                    if (_this.featuresNotFound.hasOwnProperty(key)) {
                        console.log(_this.featuresNotFound[key].zip + ' ' + _this.featuresNotFound[key].number);
                    }
                }
                console.log('-------------------------------------');
            }
            console.log('New map created: publishing...');
            _this.messageBus.publish('dynamic_project_layer', 'created', data);
            var combinedjson = _this.splitJson(data);
            _this.sendIconThroughApiManager(data.iconBase64, path.basename(ld.iconUri));
            _this.sendResourceThroughApiManager(combinedjson.resourcejson, data.reference); //For now set layerID = resourceID
            _this.sendLayerThroughApiManager(data);
        });
    };
    MapLayerFactory.prototype.splitJson = function (data) {
        var geojson = {}, resourcejson = {};
        var combinedjson = data.geojson;
        if (combinedjson.hasOwnProperty('type') && combinedjson.hasOwnProperty('features')) {
            geojson = {
                type: combinedjson.type,
                features: combinedjson.features
            };
        }
        if (combinedjson.hasOwnProperty('timestamps')) {
            geojson['timestamps'] = combinedjson['timestamps'];
        }
        if (combinedjson.hasOwnProperty('featureTypes')) {
            for (var ftName in combinedjson.featureTypes) {
                if (combinedjson.featureTypes.hasOwnProperty(ftName)) {
                    var defaultFeatureType = combinedjson.featureTypes[ftName];
                    defaultFeatureType['contourProperty'] = '_bag_contour';
                    if (defaultFeatureType.hasOwnProperty('propertyTypeData')) {
                        var propertyTypeObjects = {};
                        var propKeys = '';
                        defaultFeatureType.propertyTypeData.forEach(function (pt) {
                            propertyTypeObjects[pt.label] = pt;
                            propKeys = propKeys + pt.label + ';';
                        });
                        delete defaultFeatureType.propertyTypeData;
                        defaultFeatureType.propertyTypeKeys = propKeys;
                        defaultFeatureType.name = data.featureType;
                        resourcejson['featureTypes'] = {};
                        resourcejson.featureTypes[data.featureType] = defaultFeatureType;
                        resourcejson['propertyTypeData'] = {};
                        resourcejson.propertyTypeData = propertyTypeObjects;
                        data.defaultFeatureType = defaultFeatureType.name;
                    }
                }
            }
        }
        // console.log('TODO REMOVE writing output');
        // fs.writeFileSync('c:/Users/Erik/Downloads/tkb/' + data.reference + '_layer.json', JSON.stringify(geojson));
        // fs.writeFileSync('c:/Users/Erik/Downloads/tkb/' + data.reference + '.json', JSON.stringify(resourcejson));
        return { geojson: geojson, resourcejson: resourcejson };
    };
    MapLayerFactory.prototype.sendIconThroughApiManager = function (b64, path) {
        this.apiManager.addFile(b64, '', path, { source: 'maplayerfactory' }, function (result) {
            console.log(result);
        });
    };
    MapLayerFactory.prototype.sendResourceThroughApiManager = function (data, resourceId) {
        data.id = resourceId;
        this.apiManager.addResource(data, true, { source: 'maplayerfactory' }, function (result) { console.log(result); });
    };
    MapLayerFactory.prototype.sendLayerThroughApiManager = function (data) {
        var _this = this;
        // winston.info('Send layer: ' + JSON.stringify(data));
        var layer = this.apiManager.getLayerDefinition({
            title: data.layerTitle,
            description: data.description,
            id: data.reference,
            enabled: data.enabled,
            defaultFeatureType: data.defaultFeatureType,
            typeUrl: 'data/api/resourceTypes/' + data.reference + '.json',
            opacity: data.opacity,
            dynamicResource: true
        });
        layer.features = data.geojson.features;
        layer.timestamps = data.geojson.timestamps;
        var group = this.apiManager.getGroupDefinition({ title: data.group, id: data.group, clusterLevel: data.clusterLevel });
        async.series([
            function (cb) {
                _this.apiManager.addUpdateLayer(layer, { source: 'maplayerfactory' }, function (result) {
                    console.log(result);
                    cb();
                });
            },
            function (cb) {
                _this.apiManager.addGroup(group, data.projectId, { source: 'maplayerfactory' }, function (result) {
                    console.log(result);
                    cb();
                });
            },
            function (cb) {
                _this.apiManager.updateProjectTitle(data.project, data.projectId, { source: 'maplayerfactory' }, function (result) {
                    console.log(result);
                    cb();
                });
            },
            function (cb) {
                _this.apiManager.addLayerToProject(data.projectId, group.id, layer.id, { source: 'maplayerfactory' }, function (result) {
                    console.log(result);
                    cb();
                });
            }
        ]);
        // request({
        //     url: "http://localhost:3002/api/layers",
        //     method: "POST",
        //     json: true,
        //     body: { title: data.layerTitle, id: data.reference, features: data.geojson.features }
        // }, function(error, response, body) {
        //     console.log('Creating layer... ' + response.statusCode + ' ' + body.error);
        //     request({
        //         url: "http://localhost:3002/api/projects/" + data.projectId + "/group",
        //         method: "POST",
        //         json: true,
        //         body: { title: data.group, id: data.group}
        //     }, function(error, response, body) {
        //         console.log('Creating group... ' + response.statusCode + ' ' + body.error);
        //         request({
        //             url: "http://localhost:3002/api/projects/" + data.projectId + "/group/" + data.group + '/layer/' + data.reference,
        //             method: "POST",
        //             json: true,
        //             body: { title: data.group, id: data.group}
        //         }, function(error, response, body) {
        //             console.log('Adding layer to group... ' + response.statusCode + ' ' + body.error);
        //         });
        //     });
        // });
    };
    MapLayerFactory.prototype.processBagContours = function (req, res) {
        console.log('Received bag contours request. Processing...');
        var start = new Date().getTime();
        var template = req.body;
        var bounds = template.bounds;
        var bu_code = template.searchProp;
        var layer = template.layer;
        var getPointFeatures = false;
        if (layer.dataSourceParameters && layer.dataSourceParameters.hasOwnProperty('getPointFeatures')) {
            getPointFeatures = layer.dataSourceParameters['getPointFeatures'];
        }
        layer.data = {};
        layer.data.features = [];
        layer.type = 'database';
        this.bag.lookupBagArea(bounds || bu_code, layer.refreshBBOX, function (areas) {
            if (!areas || !areas.length || areas.length === 0) {
                res.status(404).send({});
            }
            else {
                areas.forEach(function (area) {
                    var props = {};
                    for (var p in area) {
                        if (area.hasOwnProperty(p) && area[p] != null) {
                            // Save all columns to properties, except the ones used as geometry.
                            if ((!getPointFeatures && (p === 'contour' || p === 'latlon'))
                                || (getPointFeatures && p === 'latlon')) {
                                // skip
                            }
                            else {
                                if (!isNaN(parseFloat(area[p])) && isFinite(area[p])) {
                                    props[p] = +area[p];
                                }
                                else {
                                    props[p] = area[p];
                                }
                            }
                        }
                    }
                    var f = {
                        type: 'Feature',
                        geometry: (getPointFeatures) ? JSON.parse(area.latlon) : JSON.parse(area.contour),
                        properties: props,
                        id: (getPointFeatures) ? 'p_' + props['pandid'] || Utils.newGuid() : 'c_' + props['pandid'] || Utils.newGuid()
                    };
                    layer.data.features.push(f);
                });
                var diff = new Date().getTime() - start;
                console.log('Updated bag layer: publishing ' + areas.length + ' features after ' + diff + ' ms.');
                res.status(Api.ApiResult.OK).send({ layer: layer });
                // this.messageBus.publish('bagcontouren', 'layer-update', layer);
            }
        });
    };
    MapLayerFactory.prototype.processBagSearchQuery = function (req, res) {
        var start = new Date().getTime();
        var template = req.body;
        var query = template.query;
        var nrItems = template.nrItems;
        this.bag.searchGemeente(query, nrItems, function (results) {
            if (!results || !results.length || results.length === 0) {
                res.status(200).send({});
            }
            else {
                var searchResults = [];
                results.forEach(function (r) {
                    var sr = {
                        title: "" + r.title,
                        description: "" + r.description,
                        score: 0.99,
                        location: r.location
                    };
                    searchResults.push(sr);
                });
                var diff = new Date().getTime() - start;
                console.log('Updated bag layer: returning ' + results.length + ' search results after ' + diff + ' ms.');
                res.status(Api.ApiResult.OK).send({ result: searchResults });
            }
        });
    };
    MapLayerFactory.prototype.processBagBuurten = function (req, res) {
        console.log('Received bag buurten request. Processing...');
        var start = new Date().getTime();
        var template = req.body;
        var bounds = template.bounds;
        var gm_code = template.searchProp;
        var layer = template.layer;
        layer.data = {};
        layer.data.features = [];
        layer.type = 'database';
        this.bag.lookupBagBuurt(bounds || gm_code, layer.refreshBBOX, function (areas) {
            if (!areas || !areas.length || areas.length === 0) {
                res.status(404).send({});
            }
            else {
                areas.forEach(function (area) {
                    var props = {};
                    for (var p in area) {
                        if (area.hasOwnProperty(p) && area[p] != null && p !== 'contour') {
                            // Save all columns to properties, except the ones used as geometry.
                            if (!isNaN(parseFloat(area[p])) && isFinite(area[p])) {
                                props[p] = +area[p];
                            }
                            else {
                                props[p] = area[p];
                            }
                        }
                    }
                    var f = {
                        type: 'Feature',
                        geometry: JSON.parse(area.contour),
                        properties: props,
                        id: props['bu_code'] || Utils.newGuid()
                    };
                    layer.data.features.push(f);
                });
                var diff = new Date().getTime() - start;
                console.log('Updated bag layer: publishing ' + areas.length + ' features after ' + diff + ' ms.');
                res.status(Api.ApiResult.OK).send({ layer: layer });
                // this.messageBus.publish('bagcontouren', 'layer-update', layer);
            }
        });
    };
    MapLayerFactory.prototype.createMapLayer = function (template, callback) {
        var ld = template.layerDefinition[0];
        var features = [];
        // Convert StringFormats (from a readable key to StringFormat notation)
        this.convertStringFormats(template.propertyTypes);
        // Check propertyTypeData for time-based data
        var timestamps = this.convertTimebasedPropertyData(template);
        //Add projectID to the icon name to make it unique
        var iconName = path.basename(ld.iconUri, path.extname(ld.iconUri)) + template.projectId + path.extname(ld.iconUri);
        ld.iconUri = ['data', 'images', iconName].join('/');
        var featureTypeName = ld.featureType || 'Default';
        var featureTypeContent = {
            name: featureTypeName,
            style: {
                iconUri: ld.iconUri,
                iconWidth: +ld.iconSize,
                iconHeight: +ld.iconSize,
                drawingMode: ld.drawingMode,
                stroke: ld.strokeWidth > 0,
                strokeWidth: (typeof ld.strokeWidth !== 'undefined') ? ld.strokeWidth : 3,
                strokeColor: ld.strokeColor || '#000',
                selectedStrokeColor: ld.selectedStrokeColor || '#00f',
                fillColor: ld.fillColor || '#ff0',
                opacity: 1,
                fillOpacity: 1,
                nameLabel: ld.nameLabel
            },
            propertyTypeData: template.propertyTypes
        };
        var geojson = {
            type: 'FeatureCollection',
            featureTypes: {},
            features: features
        };
        geojson.featureTypes[featureTypeName] = featureTypeContent;
        if (timestamps.length > 0) {
            geojson['timestamps'] = JSON.parse(JSON.stringify(timestamps));
        }
        // Convert dates (from a readable key to a JavaScript Date string notation)
        this.convertDateProperties(template.propertyTypes, template.properties);
        // Convert types (from a readable key to type notation)
        this.convertTypes(template.propertyTypes, template.properties);
        // Add geometry
        switch (ld.geometryType) {
            case 'Postcode6_en_huisnummer':
                if (!ld.parameter1) {
                    console.log('Error: Parameter1 should be the name of the column containing the zip code!');
                    return;
                }
                if (!ld.parameter2) {
                    console.log('Error: Parameter2 should be the name of the column containing the house number!');
                    return;
                }
                if (!ld.parameter3) {
                    console.log('Warning: Parameter3 should be the name of the column containing the house letter! Now using number only!');
                }
                if (!ld.parameter4) {
                    console.log('Warning: Parameter4 should be the name of the column containing the house number addition! Now using number only!');
                }
                if (!ld.parameter3 || !ld.parameter4) {
                    this.createPointFeature(ld.parameter1, ld.parameter2, IBagOptions.OnlyCoordinates, features, template.properties, template.propertyTypes, template.sensors || [], function () { callback(geojson); });
                }
                else {
                    this.mergeHouseNumber(ld.parameter1, ld.parameter2, ld.parameter3, ld.parameter4, template.properties);
                    this.createPointFeature(ld.parameter1, '_mergedHouseNumber', IBagOptions.OnlyCoordinates, features, template.properties, template.propertyTypes, template.sensors || [], function () { callback(geojson); });
                }
                break;
            case 'Postcode6_en_huisnummer_met_bouwjaar':
                if (!ld.parameter1) {
                    console.log('Error: Parameter1 should be the name of the column containing the zip code!');
                    return;
                }
                if (!ld.parameter2) {
                    console.log('Error: Parameter2 should be the name of the column containing the house number!');
                    return;
                }
                if (!ld.parameter3) {
                    console.log('Warning: Parameter3 should be the name of the column containing the house letter! Now using number only!');
                }
                if (!ld.parameter4) {
                    console.log('Warning: Parameter4 should be the name of the column containing the house number addition! Now using number only!');
                }
                if (!ld.parameter3 || !ld.parameter4) {
                    this.createPointFeature(ld.parameter1, ld.parameter2, IBagOptions.WithBouwjaar, features, template.properties, template.propertyTypes, template.sensors || [], function () { callback(geojson); });
                }
                else {
                    this.mergeHouseNumber(ld.parameter1, ld.parameter2, ld.parameter3, ld.parameter4, template.properties);
                    this.createPointFeature(ld.parameter1, '_mergedHouseNumber', IBagOptions.WithBouwjaar, features, template.properties, template.propertyTypes, template.sensors || [], function () { callback(geojson); });
                }
                break;
            case 'Postcode6_en_huisnummer_met_bag':
                if (!ld.parameter1) {
                    console.log('Error: Parameter1 should be the name of the column containing the zip code!');
                    return;
                }
                if (!ld.parameter2) {
                    console.log('Error: Parameter2 should be the name of the column containing the house number!');
                    return;
                }
                if (!ld.parameter3) {
                    console.log('Warning: Parameter3 should be the name of the column containing the house letter! Now using number only!');
                }
                if (!ld.parameter4) {
                    console.log('Warning: Parameter4 should be the name of the column containing the house number addition! Now using number only!');
                }
                if (!ld.parameter3 || !ld.parameter4) {
                    this.createPointFeature(ld.parameter1, ld.parameter2, IBagOptions.All, features, template.properties, template.propertyTypes, template.sensors || [], function () { callback(geojson); });
                }
                else {
                    this.mergeHouseNumber(ld.parameter1, ld.parameter2, ld.parameter3, ld.parameter4, template.properties);
                    this.createPointFeature(ld.parameter1, '_mergedHouseNumber', IBagOptions.All, features, template.properties, template.propertyTypes, template.sensors || [], function () { callback(geojson); });
                }
                break;
            case 'Postcode6_en_huisnummer_met_bag_en_woningtype':
                if (!ld.parameter1) {
                    console.log('Error: Parameter1 should be the name of the column containing the zip code!');
                    return;
                }
                if (!ld.parameter2) {
                    console.log('Error: Parameter2 should be the name of the column containing the house number!');
                    return;
                }
                if (!ld.parameter3) {
                    console.log('Warning: Parameter3 should be the name of the column containing the house letter! Now using number only!');
                }
                if (!ld.parameter4) {
                    console.log('Warning: Parameter4 should be the name of the column containing the house number addition! Now using number only!');
                }
                if (!ld.parameter3 || !ld.parameter4) {
                    this.createPointFeature(ld.parameter1, ld.parameter2, IBagOptions.AddressCountInBuilding, features, template.properties, template.propertyTypes, template.sensors || [], function () { callback(geojson); });
                }
                else {
                    this.mergeHouseNumber(ld.parameter1, ld.parameter2, ld.parameter3, ld.parameter4, template.properties);
                    this.createPointFeature(ld.parameter1, '_mergedHouseNumber', IBagOptions.AddressCountInBuilding, features, template.properties, template.propertyTypes, template.sensors || [], function () { callback(geojson); });
                }
                break;
            case 'Latitude_and_longitude':
                if (!ld.parameter1) {
                    console.log('Error: Parameter1 should be the name of the column containing the latitude!');
                    return;
                }
                if (!ld.parameter2) {
                    console.log('Error: Parameter2 should be the name of the column containing the longitude!');
                    return;
                }
                this.createLatLonFeature(ld.parameter1, ld.parameter2, features, template.properties, template.sensors || [], function () { callback(geojson); });
                break;
            case 'RD_X_en_Y':
                if (!ld.parameter1) {
                    console.log('Error: Parameter1 should be the name of the column containing the RD X coordinate!');
                    return;
                }
                if (!ld.parameter2) {
                    console.log('Error: Parameter2 should be the name of the column containing the RD Y coordinate!');
                    return;
                }
                this.createRDFeature(ld.parameter1, ld.parameter2, features, template.properties, template.sensors || [], function () { callback(geojson); });
                break;
            case 'Internationaal':
                if (!ld.parameter1) {
                    console.log('Error: Parameter1 should be the name of the column containing the search query!');
                    return;
                }
                this.createInternationalFeature(ld.parameter1, features, template.properties, template.sensors || [], function () { callback(geojson); });
                break;
            default:
                if (!ld.parameter1) {
                    console.log('Error: At least parameter1 should contain a value!');
                    return;
                }
                this.createPolygonFeature(ld.geometryFile, ld.geometryKey, ld.parameter1, ld.includeOriginalProperties, features, template.properties, template.propertyTypes, template.sensors || [], function () { callback(geojson); });
                break;
        }
        //console.log("Drawing mode" + ld.drawingMode);
        return geojson;
    };
    /**
     * This function extracts the timestamps and sensorvalues from the
     * template.propertyTypes. Every sensorvalue is parsed as propertyType in
     * MS Excel, which should be converted to a sensor-array for each feature.
     * @param  {ILayerTemplate} template : The input template coming from MS Excel
     * @return {array} timestamps        : An array with all date/times converted to milliseconds
     */
    MapLayerFactory.prototype.convertTimebasedPropertyData = function (template) {
        var _this = this;
        var propertyTypes = template.propertyTypes;
        if (!propertyTypes) {
            return;
        }
        var timestamps = [];
        var targetPropertyTypes = [];
        var realPropertyTypes = []; //Filter out propertyTypes that are actually a timestamp value
        propertyTypes.forEach(function (pt) {
            if (pt.hasOwnProperty('targetProperty')) {
                if (pt['targetProperty'] !== pt['label']) {
                    targetPropertyTypes.push(pt);
                }
                else {
                    realPropertyTypes.push(pt);
                }
                var timestamp = _this.convertTime(pt['date'], pt['time']);
                timestamps.push(timestamp);
            }
            else {
                realPropertyTypes.push(pt);
            }
        });
        template.propertyTypes = realPropertyTypes;
        //if (timestamps.length <= 0) return timestamps;
        // If the data contains time-based values, convert the corresponding properties
        // to a sensor array.
        var properties = template.properties;
        var realProperties = []; //To filter out properties that are actually a sensor value
        var realSensors = [];
        properties.forEach(function (p) {
            var realProperty = {};
            var sensors = {};
            realPropertyTypes.forEach(function (tp) {
                if (tp.hasOwnProperty('targetProperty')) {
                    sensors[tp.label] = [];
                }
            });
            for (var key in p) {
                if (p.hasOwnProperty(key)) {
                    var itemName = key;
                    if (!targetPropertyTypes.some(function (tp) {
                        if (itemName === tp['label']) {
                            sensors[tp['targetProperty']].push(p[key]);
                            return true;
                        }
                        else {
                            return false;
                        }
                    })) {
                        realProperty[itemName] = p[key];
                        if (sensors.hasOwnProperty(itemName)) {
                            sensors[itemName].push(p[key]);
                        }
                    }
                }
            }
            if (Object.keys(sensors).length !== 0) {
                realSensors.push(sensors);
            }
            realProperties.push(realProperty);
        });
        if (realSensors.length > 0) {
            template.sensors = realSensors;
        }
        template.properties = realProperties;
        return timestamps;
    };
    MapLayerFactory.prototype.createPolygonFeature = function (templateName, templateKey, par1, inclTemplProps, features, properties, propertyTypes, sensors, callback) {
        var _this = this;
        if (!properties) {
            callback();
        }
        if (!this.templateFiles.hasOwnProperty(templateName)) {
            console.log('Error: could not find template: ' + templateName);
            callback();
        }
        var templateUrl = this.templateFiles[templateName];
        var templateFile = fs.readFileSync(templateUrl);
        var templateJson = JSON.parse(templateFile.toString());
        if (inclTemplProps && templateJson.featureTypes && templateJson.featureTypes.hasOwnProperty('Default')) {
            templateJson.featureTypes['Default'].propertyTypeData.forEach(function (ft) {
                if (!properties[0].hasOwnProperty(ft.label) && ft.label !== templateKey) {
                    propertyTypes.push(ft);
                }
            });
        }
        var fts = templateJson.features;
        properties.forEach(function (p, index) {
            var foundFeature = false;
            fts.some(function (f) {
                if (f.properties[templateKey] == p[par1]) {
                    console.log(p[par1]);
                    if (inclTemplProps) {
                        for (var key in f.properties) {
                            if (!p.hasOwnProperty(key) && key !== templateKey) {
                                p[key] = f.properties[key];
                            }
                        }
                    }
                    var featureJson = {
                        type: 'Feature',
                        geometry: f.geometry,
                        properties: p
                    };
                    if (sensors.length > 0) {
                        featureJson['sensors'] = sensors[index];
                    }
                    features.push(featureJson);
                    foundFeature = true;
                    return true;
                }
                else {
                    return false;
                }
            });
            if (!foundFeature) {
                console.log('Warning: Could not find: ' + p[par1]);
                _this.featuresNotFound["" + p[par1]] = { zip: "" + p[par1], number: '' };
            }
        });
        callback();
    };
    MapLayerFactory.prototype.createInternationalFeature = function (queryString, features, properties, sensors, callback) {
        var _this = this;
        async.eachLimit(properties, 10, function (prop, innercallback) {
            var index = properties.indexOf(prop);
            if (prop.hasOwnProperty(queryString) && typeof prop[queryString] === 'string') {
                var q = prop[queryString];
                _this.bag.searchAddress(q, 4, function (locations) {
                    if (!locations || locations.length === 0 || typeof locations[0] === 'undefined') {
                        console.log("Cannot find location: " + q);
                        _this.featuresNotFound["" + q] = {
                            zip: "" + q,
                            number: "0"
                        };
                        innercallback();
                    }
                    else {
                        console.log('Found location (international)');
                        console.log(locations[0].lon + ", " + locations[0].lat);
                        features.push(_this.createFeature(+locations[0].lon, +locations[0].lat, prop, sensors[index] || {}));
                        innercallback();
                    }
                });
            }
            else {
                innercallback();
            }
        }, function (err) {
            if (err) {
                console.warn("Error performing searches " + err);
            }
            else {
                console.log('International search completed');
                callback();
            }
        });
    };
    MapLayerFactory.prototype.createLatLonFeature = function (latString, lonString, features, properties, sensors, callback) {
        var _this = this;
        if (!properties) {
            callback();
        }
        properties.forEach(function (prop, index) {
            var lat = prop[latString];
            var lon = prop[lonString];
            if (isNaN(lat) || isNaN(lon)) {
                console.log('Error: Not a valid coordinate ( ' + lat + ', ' + lon + ')');
            }
            else {
                features.push(_this.createFeature(lon, lat, prop, sensors[index] || {}));
            }
        });
        callback();
    };
    /**
     * Convert the RD coordinate to WGS84.
     */
    MapLayerFactory.prototype.createRDFeature = function (rdX, rdY, features, properties, sensors, callback) {
        var _this = this;
        if (!properties) {
            callback();
        }
        //https://github.com/yuletide/node-proj4js-defs/blob/master/epsg.js
        //Proj4js.defs["EPSG:28992"] = "+proj=sterea +lat_0=52.15616055555555 +lon_0=5.38763888888889 +k=0.9999079 +x_0=155000 +y_0=463000 
        //+ellps=bessel + towgs84=565.417, 50.3319, 465.552, -0.398957, 0.343988, -1.8774, 4.0725 + units=m + no_defs";
        proj4.defs('RD', '+proj=sterea +lat_0=52.15616055555555 +lon_0=5.38763888888889 +k=0.9999079 +x_0=155000 +y_0=463000 ' +
            ' +ellps=bessel +towgs84=565.417,50.3319,465.552,-0.398957,0.343988,-1.8774,4.0725 +units=m +no_defs');
        var converter = proj4('RD');
        properties.forEach(function (prop, index) {
            var x = prop[rdX];
            var y = prop[rdY];
            if (isNaN(x) || isNaN(y)) {
                console.log('Error: Not a valid coordinate ( ' + x + ', ' + y + ')');
            }
            else {
                var wgs = converter.inverse({ x: x, y: y });
                //console.log(JSON.stringify(wgs));
                features.push(_this.createFeature(wgs.x, wgs.y, prop, sensors[index] || {}));
            }
        });
        callback();
    };
    MapLayerFactory.prototype.mergeHouseNumber = function (zipCode, houseNumber, letter, addition, properties) {
        var merged;
        properties.forEach(function (prop, index) {
            merged = '';
            if (prop.hasOwnProperty(houseNumber)) {
                merged = prop[houseNumber] + '-';
            }
            if (prop.hasOwnProperty(letter)) {
                merged = merged + prop[letter];
            }
            if (prop.hasOwnProperty(addition)) {
                merged = merged + '-' + prop[addition];
            }
            prop['_mergedHouseNumber'] = merged.replace(/ /g, ''); // set merged houseNumber as houseNumber
        });
    };
    MapLayerFactory.prototype.createPointFeature = function (zipCode, houseNumber, bagOptions, features, properties, propertyTypes, sensors, callback) {
        if (!properties) {
            callback();
        }
        var todo = properties.length;
        var bg = this.bag;
        var asyncthis = this;
        async.eachSeries(properties, function (prop, innercallback) {
            var index = properties.indexOf(prop);
            if (prop.hasOwnProperty(zipCode) && typeof prop[zipCode] === 'string') {
                var zip = prop[zipCode].replace(/ /g, '');
                var nmb = prop[houseNumber];
                bg.lookupBagAddress(zip, nmb, bagOptions, function (locations) {
                    //console.log(todo);
                    if (!locations || locations.length === 0 || typeof locations[0] === 'undefined') {
                        console.log("Cannot find location with zip: " + zip + ", houseNumber: " + nmb);
                        asyncthis.featuresNotFound["" + zip + nmb] = { zip: "" + zip, number: "" + nmb };
                    }
                    else {
                        for (var key in locations[0]) {
                            if (key !== 'lon' && key !== 'lat') {
                                if (locations[0][key]) {
                                    prop[(key.charAt(0).toUpperCase() + key.slice(1))] = locations[0][key];
                                    asyncthis.createPropertyType(propertyTypes, (key.charAt(0).toUpperCase() + key.slice(1)), 'BAG');
                                }
                            }
                        }
                        if (prop.hasOwnProperty('_mergedHouseNumber')) {
                            delete prop['_mergedHouseNumber'];
                        }
                        //console.log('locations[0] ' + locations[0]);
                        features.push(asyncthis.createFeature(locations[0].lon, locations[0].lat, prop, sensors[index] || {}));
                    }
                    innercallback();
                });
            }
            else {
                //console.log('No valid zipcode found: ' + prop[zipCode]);
                innercallback();
            }
        }, function (err) {
            callback();
        });
        // properties.forEach((prop, index) => {
        //     if (prop.hasOwnProperty(zipCode) && typeof prop[zipCode] === 'string') {
        //         var zip = prop[zipCode].replace(/ /g, '');
        //         var nmb = prop[houseNumber];
        //         this.bag.lookupBagAddress(zip, nmb, bagOptions, (locations: Location[]) => {
        //             //console.log(todo);
        //             if (!locations || locations.length === 0 || typeof locations[0] == 'undefined') {
        //                 console.log(`Cannot find location with zip: ${zip}, houseNumber: ${nmb}`);
        //                 this.featuresNotFound[`${zip}${nmb}`] = { zip: `${zip}`, number: `${nmb}` };
        //             } else {
        //                 for (var key in locations[0]) {
        //                     if (key !== "lon" && key !== "lat") {
        //                         if (locations[0][key]) {
        //                             prop[(key.charAt(0).toUpperCase() + key.slice(1))] = locations[0][key];
        //                             this.createPropertyType(propertyTypes, (key.charAt(0).toUpperCase() + key.slice(1)), "BAG");
        //                         }
        //                     }
        //                 }
        //                 if (prop.hasOwnProperty('_mergedHouseNumber')) delete prop['_mergedHouseNumber'];
        //                 //console.log('locations[0] ' + locations[0]);
        //                 features.push(this.createFeature(locations[0].lon, locations[0].lat, prop, sensors[index] || {}));
        //             }
        //         });
        //         todo--;
        //         if (todo <= 0)
        //           callback();
        //     } else {
        //         console.log('No valid zipcode found: ' + prop[zipCode]);
        //         todo--;
        //     }
        // });
    };
    MapLayerFactory.prototype.createFeature = function (lon, lat, properties, sensors) {
        var gjson = {
            type: 'Feature',
            geometry: {
                type: 'Point',
                coordinates: [lon, lat]
            },
            properties: properties
        };
        if (Object.keys(sensors).length !== 0) {
            gjson['sensors'] = sensors;
        }
        return gjson;
    };
    MapLayerFactory.prototype.createPropertyType = function (propertyTypes, name, section) {
        if (!name) {
            return;
        }
        var propertyTypeExists = false;
        propertyTypes.some(function (pt) {
            if (pt.label.toLowerCase() === name.toLowerCase()) {
                propertyTypeExists = true;
                return true;
            }
            else {
                return false;
            }
        });
        if (propertyTypeExists) {
            return;
        }
        var propType = {
            label: name,
            title: name,
            type: 'text',
            visibleInCallOut: true,
            canEdit: true,
            isSearchable: false
        };
        if (section) {
            propType['section'] = section;
        }
        switch (name.toLowerCase()) {
            case 'oppervlakteverblijfsobject':
            case 'bouwjaar':
                propType.type = 'number';
                break;
            case '_bag_contour':
                propType.visibleInCallOut = false;
                break;
        }
        propertyTypes.push(propType);
    };
    MapLayerFactory.prototype.convertTime = function (date, time) {
        if (!date || date.length < 6) {
            return 0;
        }
        var year = Number(date.substr(0, 4));
        var month = Number(date.substr(4, 2));
        var day = Number(date.substr(6, 2));
        var d = new Date(0);
        d.setFullYear(year);
        d.setMonth(month - 1);
        d.setDate(day);
        //TODO: Take time into account
        var timeInMs = d.getTime();
        console.log('Converted ' + date + ' ' + time + ' to ' + d.toDateString() + ' (' + d.getTime() + ' ms)');
        return timeInMs;
    };
    MapLayerFactory.prototype.convertDateProperties = function (propertyTypes, properties) {
        var _this = this;
        if (!propertyTypes || !properties) {
            return;
        }
        propertyTypes.forEach(function (pt) {
            if (pt.hasOwnProperty('type') && pt['type'] === 'date') {
                var name = pt['label']; //Store name of the property with type "date"
                properties.forEach(function (p) {
                    if (p.hasOwnProperty(name)) {
                        var timeInMs = _this.convertTime(p[name], ''); //TODO: Add Time compatibility
                        p[name] = timeInMs;
                        //var d = new Date(timeInMs);
                        //p[name] = d.toString();
                    }
                });
            }
        });
    };
    MapLayerFactory.prototype.convertTypes = function (propertyTypes, properties) {
        if (!propertyTypes || !properties) {
            return;
        }
        propertyTypes.forEach(function (pt) {
            if (pt.hasOwnProperty('type') && pt['type'] === 'url') {
                var name = pt['label']; //Store name of the property with type "url"
                properties.forEach(function (p) {
                    if (p.hasOwnProperty(name)) {
                        if (p[name].substring(0, 3) === 'www') {
                            p[name] = '[url=http://' + p[name] + ']' + (pt['stringFormat'] ? pt['stringFormat'] : p[name]) + '[/url]';
                        }
                        else {
                            p[name] = '[url=' + p[name] + ']' + (pt['stringFormat'] ? pt['stringFormat'] : p[name]) + '[/url]';
                        }
                    }
                });
                // Prepare propType for use in csWeb-client
                pt['type'] = 'bbcode';
                delete pt['stringFormat'];
            }
        });
    };
    MapLayerFactory.prototype.convertStringFormats = function (properties) {
        properties.forEach(function (prop) {
            if (prop.hasOwnProperty('stringFormat')) {
                switch (prop['stringFormat']) {
                    case 'No_decimals':
                        prop['stringFormat'] = '{0:#,#}';
                        break;
                    case 'One_decimal':
                        prop['stringFormat'] = '{0:#,#.#}';
                        break;
                    case 'Two_decimals':
                        prop['stringFormat'] = '{0:#,#.##}';
                        break;
                    case 'Euro_no_decimals':
                        prop['stringFormat'] = '€{0:#,#}';
                        break;
                    case 'Euro_two_decimals':
                        prop['stringFormat'] = '€{0:#,#.00}';
                        break;
                    case 'Percentage_no_decimals':
                        prop['stringFormat'] = '{0:#,#}%';
                        break;
                    case 'Percentage_one_decimal':
                        prop['stringFormat'] = '{0:#,#.#}%';
                        break;
                    case 'Percentage_two_decimals':
                        prop['stringFormat'] = '{0:#,#.##}%';
                        break;
                    case 'Percentage_four_decimals':
                        prop['stringFormat'] = '{0:#,#.####}%';
                        break;
                    default:
                        if ((prop['stringFormat'].indexOf('{') < 0) && (prop['stringFormat'].indexOf('}') < 0)) {
                            console.log('stringFormat \'' + prop['stringFormat'] + '\' not found.');
                        }
                        break;
                }
            }
        });
    };
    return MapLayerFactory;
}());
exports.MapLayerFactory = MapLayerFactory;
//# sourceMappingURL=MapLayerFactory.js.map