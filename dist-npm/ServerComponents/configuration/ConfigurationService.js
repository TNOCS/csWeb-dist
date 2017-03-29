"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var fs = require("fs");
/**
 * Service that contains default configuration options.
 * Is based on csComp.Helpers.Dictionary.
 */
var ConfigurationService = (function () {
    /**
     * Create a configuration service based on a configuration file.
     */
    function ConfigurationService(configurationFile) {
        this.configurationFile = configurationFile;
        if (!configurationFile)
            return;
        var content;
        if (typeof configurationFile === 'string') {
            var data = fs.readFileSync(configurationFile, 'utf8');
            content = JSON.parse(data);
        }
        else {
            content = configurationFile;
        }
        for (var key in content) {
            if (content.hasOwnProperty(key)) {
                var value = content[key];
                this.add(key, value);
            }
        }
        // fs.readFile(configurationFile, 'utf8', (err, data) => {
        //   if (err) throw err;
        //   var content: Object = JSON.parse(data);
        //   for (var key in content) {
        //       if (content.hasOwnProperty(key)) {
        //           var value = content[key];
        //           this.add(key, value);
        //       }
        //   }
        // });
    }
    ConfigurationService.prototype.initialize = function (init) {
        for (var x = 0; x < init.length; x++) {
            this[init[x].key] = init[x].value;
            ConfigurationService.theKeys.push(init[x].key);
            ConfigurationService.theValues.push(init[x].value);
        }
    };
    ConfigurationService.prototype.add = function (key, value) {
        this[key] = value;
        ConfigurationService.theKeys.push(key);
        ConfigurationService.theValues.push(value);
    };
    ConfigurationService.prototype.remove = function (key) {
        var index = ConfigurationService.theKeys.indexOf(key, 0);
        ConfigurationService.theKeys.splice(index, 1);
        ConfigurationService.theValues.splice(index, 1);
        delete this[key];
    };
    ConfigurationService.prototype.clear = function () {
        for (var i = ConfigurationService.theKeys.length; i >= 0; i--) {
            var key = ConfigurationService.theKeys[i];
            this.remove(key);
        }
    };
    ConfigurationService.prototype.count = function () {
        return ConfigurationService.theKeys.length;
    };
    ConfigurationService.prototype.keys = function () {
        return ConfigurationService.theKeys;
    };
    ConfigurationService.prototype.values = function () {
        return ConfigurationService.theValues;
    };
    ConfigurationService.prototype.containsKey = function (key) {
        return (typeof this[key] !== "undefined");
    };
    ConfigurationService.prototype.toLookup = function () {
        return this;
    };
    return ConfigurationService;
}());
ConfigurationService.theKeys = [];
ConfigurationService.theValues = [];
exports.ConfigurationService = ConfigurationService;
//# sourceMappingURL=ConfigurationService.js.map