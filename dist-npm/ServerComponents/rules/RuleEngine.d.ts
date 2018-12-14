import Rule = require('./Rule');
import Api = require('../api/ApiManager');
import Layer = Api.Layer;
import Feature = Api.Feature;
export interface IRuleEngineService {
    /**
     * Send update to all clients.
     * @action: logs-update, feature-update
     * @skip: this one will be skipped ( e.g original source)
     */
    updateFeature?: (feature: Feature) => void;
    addFeature?: (feature: Feature) => void;
    /** Update log message */
    updateLog?: (featureId: string, msgBody: {
        [key: string]: Api.Log[];
    }) => void;
    layer?: Layer;
    activateRule?: (ruleId: string) => void;
    deactivateRule?: (ruleId: string) => void;
    timer?: HyperTimer;
}
export declare class RuleEngine {
    private loadedScripts;
    private worldState;
    /** A set of rules that are active but have not yet fired. */
    private activeRules;
    /** A set of rules that are inactive and may become activated. */
    private inactiveRules;
    /** A set of rules to activate at the end of the rule evaluation cycle */
    private activateRules;
    /** A set of rules to deactivate at the end of the rule evaluation cycle */
    private deactivateRules;
    /** Unprocessed features that haven't been evaluated yet */
    private featureQueue;
    private isBusy;
    private timer;
    /**
     * Send update to all clients.
     * @action: logs-update, feature-update
     * @skip: this one will be skipped ( e.g original source)
     */
    service: IRuleEngineService;
    layer: Api.Layer;
    constructor(manager: Api.ApiManager, layerId: string);
    /**
     * Activate a specific rule.
     * @method activateRule
     * @param  {string}     ruleId The Id of the rule
     * @return {void}
     */
    activateRule(ruleId: string): void;
    /**
     * Deactivate a specific rule.
     * @method deactivateRule
     * @param  {string}       ruleId The Id of the rule
     * @return {void}
     */
    deactivateRule(ruleId: string): void;
    /**
     * Indicates whether the engine is ready to evaluate the rules.
     */
    isReady(): boolean;
    /**
     * Load one or more rule files.
     * @method loadRules
     * @param  {string | string[]}    filename String or string[] with the full filename
     * @param  {Date}      activationTime Optional date that indicates when the rules are activated.
     * @return {void}
     */
    loadRules(filename: string | string[], activationTime?: Date): void;
    /**
     * Internal method to actually load a rule file.
     */
    private loadRuleFile(filename, activationTime);
    /**
     * Add a rule to the engine.
     */
    addRule(rule: Rule.IRule, feature?: Feature, activationTime?: Date): void;
    /**
     * Evaluate the rules, processing the current feature
     */
    evaluateRules(feature?: Feature): void;
}
