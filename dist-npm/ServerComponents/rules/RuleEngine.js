"use strict";
var fs = require('fs');
var HyperTimer = require('hypertimer');
var WorldState = require('./WorldState');
var Rule = require('./Rule');
var Api = require('../api/ApiManager');
var RuleEngine = (function () {
    function RuleEngine(manager, layerId) {
        var _this = this;
        this.loadedScripts = []; // needed to restart
        this.worldState = new WorldState();
        /** A set of rules that are active but have not yet fired. */
        this.activeRules = [];
        /** A set of rules that are inactive and may become activated. */
        this.inactiveRules = [];
        /** A set of rules to activate at the end of the rule evaluation cycle */
        this.activateRules = [];
        /** A set of rules to deactivate at the end of the rule evaluation cycle */
        this.deactivateRules = [];
        /** Unprocessed features that haven't been evaluated yet */
        this.featureQueue = [];
        /**
         * Send update to all clients.
         * @action: logs-update, feature-update
         * @skip: this one will be skipped ( e.g original source)
         */
        this.service = {};
        this.timer = new HyperTimer();
        manager.getLayer(layerId, {}, function (result) {
            _this.layer = result.layer;
            _this.service.updateFeature = function (feature) { return manager.updateFeature(layerId, feature, {}, function () { }); };
            _this.service.addFeature = function (feature) { return manager.addFeature(layerId, feature, {}, function () { }); };
            _this.service.updateLog = function (featureId, logs) {
                return manager.updateLogs(layerId, featureId, logs, {}, function () { });
            };
            _this.service.layer = _this.layer;
            _this.service.activateRule = function (ruleId) { return _this.activateRule(ruleId); };
            _this.service.deactivateRule = function (ruleId) { return _this.deactivateRule(ruleId); };
            _this.service.timer = _this.timer;
            _this.timer.on('error', function (err) {
                console.log('Error:', err);
            });
            manager.on(Api.Event[Api.Event.FeatureChanged], function (fc) {
                if (fc.id !== layerId)
                    return;
                console.log("Feature update with id " + fc.value.id + " and layer id " + layerId + " received in the rule engine.");
                var featureId = fc.value.id;
                _this.worldState.activeFeature = undefined;
                _this.layer.features.some(function (f) {
                    if (f.id !== featureId)
                        return false;
                    _this.worldState.activeFeature = f;
                    _this.evaluateRules(f);
                    return true;
                });
            });
            // layer.connection.subscribe("rti", (msg: { action: string; data: any }, id: string) => {
            //     switch (msg.data) {
            //         case "restart":
            //             console.log("Rule engine: restarting script");
            //             this.timer.destroy();
            //             this.timer = new HyperTimer();
            //             this.timer.on('error', (err) => {
            //                 console.log('Error:', err);
            //             });
            //             this.worldState = new WorldState();
            //             this.activeRules = [];
            //             this.inactiveRules = [];
            //             this.activateRules = [];
            //             this.deactivateRules = [];
            //             this.featureQueue = [];
            //             this.isBusy = false;
            //             var scriptCount = this.loadedScripts.length;
            //             this.loadedScripts.forEach(s => {
            //                 this.loadRuleFile(s, this.timer.getTime());
            //             });
            //             break;
            //     }
            // });
        });
    }
    /**
     * Activate a specific rule.
     * @method activateRule
     * @param  {string}     ruleId The Id of the rule
     * @return {void}
     */
    RuleEngine.prototype.activateRule = function (ruleId) {
        for (var i = 0; i < this.inactiveRules.length; i++) {
            var rule = this.inactiveRules[i];
            if (rule.id !== ruleId)
                continue;
            rule.isActive = true;
            this.activeRules.push(rule);
            return;
        }
    };
    /**
     * Deactivate a specific rule.
     * @method deactivateRule
     * @param  {string}       ruleId The Id of the rule
     * @return {void}
     */
    RuleEngine.prototype.deactivateRule = function (ruleId) {
        for (var i = 0; i < this.activeRules.length; i++) {
            var rule = this.activeRules[i];
            if (rule.id !== ruleId)
                continue;
            rule.isActive = false;
            this.inactiveRules.push(rule);
            return;
        }
    };
    /**
     * Indicates whether the engine is ready to evaluate the rules.
     */
    RuleEngine.prototype.isReady = function () { return this.isBusy; };
    /**
     * Load one or more rule files.
     * @method loadRules
     * @param  {string | string[]}    filename String or string[] with the full filename
     * @param  {Date}      activationTime Optional date that indicates when the rules are activated.
     * @return {void}
     */
    RuleEngine.prototype.loadRules = function (filename, activationTime) {
        var _this = this;
        if (typeof activationTime === 'undefined')
            activationTime = this.timer.getTime();
        if (typeof filename === "string") {
            this.loadRuleFile(filename, activationTime);
        }
        else {
            filename.forEach(function (f) { return _this.loadRuleFile(f, activationTime); });
        }
    };
    /**
     * Internal method to actually load a rule file.
     */
    RuleEngine.prototype.loadRuleFile = function (filename, activationTime) {
        var _this = this;
        if (this.loadedScripts.indexOf(filename) < 0)
            this.loadedScripts.push(filename);
        fs.readFile(filename, 'utf8', function (err, data) {
            if (err) {
                console.error('Error opening rules: ' + filename);
                console.error(err);
                return;
            }
            var geojson = JSON.parse(data);
            console.log("#features: " + geojson.features.length);
            geojson.features.forEach(function (f) {
                _this.worldState.features.push(f);
                if (typeof f.properties === 'undefined' || !f.properties.hasOwnProperty("_rules"))
                    return;
                var rules = f.properties["_rules"];
                /*console.log(JSON.stringify(rules, null, 2));*/
                rules.forEach(function (r) { return _this.addRule(r, f, activationTime); });
            });
            _this.evaluateRules();
        });
    };
    /**
     * Add a rule to the engine.
     */
    RuleEngine.prototype.addRule = function (rule, feature, activationTime) {
        if (typeof rule.actions === 'undefined' || rule.actions.length === 0 || rule.actions[0].length === 0)
            return;
        var newRule = new Rule.Rule(rule, activationTime);
        if (!rule.isGenericRule && feature) {
            newRule.feature = feature;
        }
        if (newRule.isActive)
            this.activeRules.push(newRule);
        else
            this.inactiveRules.push(newRule);
    };
    /**
     * Evaluate the rules, processing the current feature
     */
    RuleEngine.prototype.evaluateRules = function (feature) {
        var _this = this;
        if (this.isBusy) {
            console.warn("Added feature ${feature.id} to the queue (#items: $this.featureQueue.length}).");
            this.featureQueue.push(feature);
            return;
        }
        this.isBusy = true;
        // Update the set of applicable rules
        this.activeRules = this.activeRules.filter(function (r) { return r.isActive; });
        this.inactiveRules = this.inactiveRules.filter(function (r) { return !r.isActive; });
        console.log("Starting to evaluate " + this.activeRules.length + " rules...");
        // Process all rules
        this.worldState.activeFeature = feature;
        this.activeRules.forEach(function (r) { return r.process(_this.worldState, _this.service); });
        // Add rules to activate to the activeRules
        /*this.activateRules.forEach(ruleId => {
            // use array.some
            for (let i = 0; i < this.inactiveRules.length; i++) {
                var rule = this.inactiveRules[i];
                if (rule.id !== ruleId) continue;
                rule.isActive = true;
                this.activeRules.push(rule);
                this.inactiveRules.splice(i, 1);
                return;
            }
        });*/
        // Add rules to deactivate to the inactiveRules
        /*this.deactivateRules.forEach(ruleId => {
            for (let i = 0; i < this.activeRules.length; i++) {
                var rule = this.activeRules[i];
                if (rule.id !== ruleId) continue;
                rule.isActive = false;
                this.inactiveRules.push(rule);
                this.activeRules.splice(i, 1);
                return;
            }
        });*/
        this.isBusy = false;
        if (this.featureQueue.length > 0) {
            var f = this.featureQueue.pop();
            this.evaluateRules(f);
        }
        console.log('Ready evaluating rules...');
    };
    return RuleEngine;
}());
exports.RuleEngine = RuleEngine;
//# sourceMappingURL=RuleEngine.js.map