import IConfiguration = require('./IConfiguration');
/**
 * Service that contains default configuration options.
 * Is based on csComp.Helpers.Dictionary.
 */
export declare class ConfigurationService implements IConfiguration {
    private configurationFile?;
    private static theKeys;
    private static theValues;
    /**
     * Create a configuration service based on a configuration file.
     */
    constructor(configurationFile?: string | Object);
    initialize(init: {
        key: string;
        value: string;
    }[]): void;
    add(key: string, value: string): void;
    remove(key: string): void;
    clear(): void;
    count(): number;
    keys(): string[];
    values(): string[];
    containsKey(key: string): boolean;
    toLookup(): IConfiguration;
}
