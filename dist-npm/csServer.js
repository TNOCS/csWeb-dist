"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var express = require("express");
var async = require("async");
var path = require("path");
var Winston = require("winston");
var _ = require("underscore");
var compress = require('compression');
var csweb = require("./index");
var csServerOptions = (function () {
    function csServerOptions() {
        this.port = 3002;
        /** If true (default), use CORRS. Optionally, specify the supported methods in corsSupportedMethods. */
        this.corrsEnabled = true;
        /** Comma separated string with CORRS messages, e.g. POST, PATCH, GET (default), OPTIONS, DELETE, PUT */
        this.corrsSupportedMethods = 'GET';
    }
    return csServerOptions;
}());
exports.csServerOptions = csServerOptions;
var csServer = (function () {
    function csServer(dir, options) {
        if (options === void 0) { options = new csServerOptions(); }
        this.dir = dir;
        this.options = options;
        this.server = express();
    }
    csServer.prototype.start = function (started) {
        var _this = this;
        Winston.info("starting csServer");
        var favicon = require('serve-favicon');
        var bodyParser = require('body-parser');
        this.httpServer = require('http').Server(this.server);
        this.cm = new csweb.ConnectionManager(this.httpServer);
        this.messageBus = new csweb.MessageBusService();
        this.config = new csweb.ConfigurationService(path.join(this.dir, 'configuration.json'));
        // all environments
        this.server.set('port', this.options.port);
        this.server.use(favicon(this.dir + '/public/favicon.ico'));
        //increased limit size, see: http://stackoverflow.com/questions/19917401/node-js-express-request-entity-too-large
        this.server.use(bodyParser.json({ limit: '25mb' })); // support json encoded bodies
        this.server.use(bodyParser.urlencoded({ limit: '25mb', extended: true, parameterLimit: 100000 })); // support encoded bodies
        this.server.use(compress());
        if (this.options.corrsEnabled) {
            // CORRS: see http://stackoverflow.com/a/25148861/319711
            this.server.use(function (req, res, next) {
                res.header('Access-Control-Allow-Origin', 'http://localhost');
                res.header('Access-Control-Allow-Methods', this.options.corrsSupportedMethods);
                res.header('Access-Control-Allow-Headers', 'X-Requested-With, Content-Type, cache-control');
                // res.header('Access-Control-Max-Age', '3600');
                // res.header('Access-Control-Expose-Headers', 'Location');
                // res.header('cache-control', 'no-store');
                next();
            });
        }
        this.config.add('server', 'http://localhost:' + this.options.port);
        if (this.options.swagger === true)
            this.server.use('/swagger', express.static(path.join(this.dir, 'swagger')));
        this.server.use(express.static(path.join(this.dir, 'public')));
        if (!this.options.hasOwnProperty('connectors'))
            this.options.connectors = {};
        var c = this.options.connectors;
        // Create FileStorage
        if (!c.hasOwnProperty('file'))
            c['file'] = { path: path.join(path.resolve(this.dir), 'public/data/api/') };
        var fsWatch = (c['file'].hasOwnProperty('watch') ? c['file'].watch : true);
        var fsIgnoreInitial = (c['file'].hasOwnProperty('ignoreInitial') ? c['file'].ignoreInitial : false);
        var fs = new csweb.FileStorage(c['file'].path, fsWatch, fsIgnoreInitial);
        // For nodemon restarts
        process.once('SIGUSR2', function () {
            Winston.info('Nodemon Shutdown');
            _this.gracefulShutdown();
        });
        // Also trigger clean shutdown on Ctrl-C
        process.on('SIGINT', function () {
            _this.gracefulShutdown();
        });
        this.httpServer.listen(this.server.get('port'), function () {
            Winston.info('Express server listening on port ' + _this.server.get('port'));
            /*
             * API platform
             */
            _this.api = new csweb.ApiManager('cs', 'cs');
            _this.api.init(path.join(path.resolve(_this.dir), 'public/data/api'), function () {
                //api.authService = new csweb.AuthAPI(api, server, '/api');
                var connectors = [
                    { key: 'rest', s: new csweb.RestAPI(_this.server), options: {} },
                    { key: 'file', s: fs, options: {} },
                    { key: 'socketio', s: new csweb.SocketIOAPI(_this.cm), options: {} }
                ];
                if (c.hasOwnProperty('mqtt'))
                    connectors.push({ key: 'mqtt', s: new csweb.MqttAPI(c['mqtt'].server, c['mqtt'].port), options: {} });
                //if (c.hasOwnProperty('mongo')) connectors.push({ key: 'mongo', s: new csweb.MongoDBStorage(c['mongo'].server, c['mongo'].port), options: {} });
                if (c.hasOwnProperty('kafka')) {
                    console.log("TEST:" + JSON.stringify(c['kafka']));
                    connectors.push({ key: 'kafka', s: new csweb.KafkaAPI(c['kafka'].server, c['kafka'].port, c['kafka']), options: {} });
                }
                _this.api.addConnectors(connectors, function () {
                    started();
                });
            });
        });
    };
    csServer.prototype.gracefulShutdown = function () {
        var _this = this;
        Winston.info("Attempting to shut down ...");
        if (this.api && this.api.connectors) {
            async.each(_.toArray(this.api.connectors), function (c, cb) {
                if (c.exit) {
                    console.log("Closing " + c.id);
                    c.exit(function () {
                        Winston.info("Finished closing " + c.id);
                        //  delete this.api.connectors[c.id];
                        cb();
                    });
                }
            }, function () {
                Winston.info("Stopping server");
                _this.httpServer.close();
                Winston.info("Done closing connectors");
                process.exit(0);
            });
        }
    };
    return csServer;
}());
exports.csServer = csServer;
//# sourceMappingURL=csServer.js.map