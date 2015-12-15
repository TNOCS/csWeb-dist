import RuleEngine = require('./RuleEngine');
import WorldState = require('./WorldState');
import ApiManager = require('../api/ApiManager');
import Feature = ApiManager.Feature;
export interface IRule {
    /** Identifier */
    id?: string;
    /**
     * Descriptive text, is not used in the code but only for annotation purposes.
     * @type {string}
     */
    description?: string;
    /**
     * The time the rule is activated.
     * Typically, at start, but some rules may be activated at a later time..
     */
    activatedAt?: Date;
    /** * The rule can only be fired when it is active. */
    isActive?: boolean;
    /**
     * If true (default is false), indicates that we are dealing with a generic rule,
     * i.e. not tied to a specific feature.
     * @type {boolean}
     */
    isGenericRule?: boolean;
    /** How many times can the rule be fired: -1 is indefinetely, default is once */
    recurrence?: number;
    /** Feature this rule applies too */
    feature?: Feature;
    /**
     * (Set of) condition(s) that need to be fulfilled in order to process the actions.
     * In case the condition is empty, the rule is always fired, on every process.
     */
    conditions?: [[string | number | boolean]];
    /** Set of actions that will be executed when */
    actions?: [[string | number | boolean]];
    /** Evaluate the rule and execute all actions, is applicable. */
    process?: (worldState: WorldState, service: RuleEngine.IRuleEngineService) => void;
}
/**
 * Simple rule, consisting of a condition and an action.
 */
export declare class Rule implements IRule {
    /** Identifier */
    id: string;
    description: string;
    /**
     * The time the rule is activated.
     * Typically, at start, but some rules may be activated at a later time..
     */
    activatedAt: Date;
    isGenericRule: boolean;
    /** The rule can only be fired when it is active. */
    isActive: boolean;
    /** How many times can the rule be fired: -1 is indefinetely, default is once */
    recurrence: number;
    feature: Feature;
    /**
     * (Set of) condition(s) that need to be fulfilled in order to process the actions.
     * In case the condition is empty, the rule is always fired, on every process.
     */
    conditions: [[string | number | boolean]];
    /** Set of actions that will be executed when */
    actions: [[string | number | boolean]];
    /** Create a new rule. */
    constructor(rule: IRule, activationTime?: Date);
    /** Evaluate the rule and execute all actions, is applicable. */
    process(worldState: WorldState, service: RuleEngine.IRuleEngineService): void;
    /** Evaluate the conditions and check whether all of them are true (AND). */
    private evaluateConditions(worldState);
    private showWarning(condition);
    private executeActions(worldState, service);
    private setTimerForProperty(service, key, value, delay?, isAnswer?);
    private static updateLog(f, logs, key, now, value);
    private updateProperty(f, service, key, value, isAnswer?);
    /** Get the delay, if present, otherwise return 0 */
    private getDelay(actions, index);
}
