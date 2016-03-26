"use strict";
var express = require('express');
var path = require('path');
var Winston = require('winston');
var csweb = require('./index');
var csServerOptions = (function () {
    function csServerOptions() {
        this.port = 3002;
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
        var favicon = require('serve-favicon');
        var bodyParser = require('body-parser');
        this.httpServer = require('http').Server(this.server);
        this.cm = new csweb.ConnectionManager(this.httpServer);
        this.messageBus = new csweb.MessageBusService();
        this.config = new csweb.ConfigurationService('./configuration.json');
        // all environments 
        this.server.set('port', this.options.port);
        this.server.use(favicon(this.dir + '/public/favicon.ico'));
        //increased limit size, see: http://stackoverflow.com/questions/19917401/node-js-express-request-entity-too-large
        this.server.use(bodyParser.json({ limit: '25mb' })); // support json encoded bodies
        this.server.use(bodyParser.urlencoded({ limit: '25mb', extended: true })); // support encoded bodies
        this.config.add('server', 'http://localhost:' + this.options.port);
        if (this.options.swagger === true)
            this.server.use('/swagger', express.static(path.join(this.dir, 'swagger')));
        this.server.use(express.static(path.join(this.dir, 'public')));
        if (!this.options.hasOwnProperty('connectors'))
            this.options.connectors = {};
        var c = this.options.connectors;
        if (!c.hasOwnProperty('file'))
            c['file'] = { path: path.join(path.resolve(this.dir), 'public/data/api/') };
        var fs = new csweb.FileStorage(c['file'].path);
        this.httpServer.listen(this.server.get('port'), function () {
            Winston.info('Express server listening on port ' + _this.server.get('port'));
            /*
             * API platform
             */
            _this.api = new csweb.ApiManager('cs', 'cs');
            _this.api.init(path.join(path.resolve(_this.dir), 'public/data/api'), function () {
                //api.authService = new csweb.AuthAPI(api, server, '/api');
                var connectors = [{ key: 'rest', s: new csweb.RestAPI(_this.server), options: {} },
                    { key: 'file', s: fs, options: {} },
                    { key: 'socketio', s: new csweb.SocketIOAPI(_this.cm), options: {} }
                ];
                if (c.hasOwnProperty('mqtt'))
                    connectors.push({ key: 'mqtt', s: new csweb.MqttAPI(c['mqtt'].server, c['mqtt'].port), options: {} });
                //if (c.hasOwnProperty('mongo')) connectors.push({ key: 'mongo', s: new csweb.MongoDBStorage(c['mongo'].server, c['mongo'].port), options: {} });                
                _this.api.addConnectors(connectors, function () {
                    started();
                });
            });
        });
    };
    return csServer;
}());
exports.csServer = csServer;
//# sourceMappingURL=csServer.js.map