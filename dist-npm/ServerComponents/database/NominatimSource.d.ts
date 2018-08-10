import ConfigurationService = require('../configuration/ConfigurationService');
import IAddressSource = require('../database/IAddressSource');
export declare class NominatimSource implements IAddressSource.IAddressSource {
    private connectionString;
    name: string;
    constructor(config: ConfigurationService.ConfigurationService);
    init(): void;
    searchAddress(query: string, limit: number, callback: (searchResults) => void): void;
    searchGemeente(query: string, limit: number, callback: (searchResults) => void): void;
}
