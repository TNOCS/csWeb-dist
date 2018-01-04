"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var Utils = require("../helpers/Utils");
var ApiServiceManager = /** @class */ (function () {
    function ApiServiceManager(server, config) {
        this.server = server;
        this.config = config;
        this.apiServices = [];
        this.baseUrl = config['apiAddress'] || '/api';
        this.dataUrl = config['dataApiAddress'] || '/data';
    }
    Object.defineProperty(ApiServiceManager.prototype, "BaseUrl", {
        get: function () { return this.baseUrl; },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(ApiServiceManager.prototype, "DataUrl", {
        get: function () { return this.dataUrl; },
        enumerable: true,
        configurable: true
    });
    /**
     * Add a service, initialize it, and return the service GUID.
     */
    ApiServiceManager.prototype.addService = function (service) {
        service.id = Utils.newGuid();
        service.init(this, this.server, this.config);
        this.apiServices.push(service);
        return service.id;
    };
    /**
     * Find a service by ID (GUID). Returns null when no matching service is found.
     */
    ApiServiceManager.prototype.findServiceById = function (serviceId) {
        for (var i = 0; i < this.apiServices.length; i++) {
            var service = this.apiServices[i];
            if (service.id !== serviceId)
                continue;
            return service;
        }
        return null;
    };
    /**
     * Remove service by ID (GUID).
     */
    ApiServiceManager.prototype.removeService = function (serviceId) {
        for (var i = 0; i < this.apiServices.length; i++) {
            var service = this.apiServices[i];
            if (service.id !== serviceId)
                continue;
            service.shutdown();
            this.apiServices.slice(i, 1);
            return;
        }
    };
    return ApiServiceManager;
}());
exports.ApiServiceManager = ApiServiceManager;
//# sourceMappingURL=ApiServiceManager.js.map