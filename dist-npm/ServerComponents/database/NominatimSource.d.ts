import ConfigurationService = require('../configuration/ConfigurationService');
import IBagOptions = require('../database/IBagOptions');
import IAddressSource = require('../database/IAddressSource');
export declare class NominatimSource implements IAddressSource.IAddressSource {
    private connectionString;
    constructor(config: ConfigurationService.ConfigurationService);
    init(): void;
    searchAddress(query: string, limit: number, callback: (searchResults) => void): void;
    searchGemeente(query: string, limit: number, callback: (searchResults) => void): void;
    lookupBagArea(bounds: string, isArea: boolean, callback: Function): void;
    lookupBagBuurt(bounds: string, isArea: boolean, callback: Function): void;
    lookupBagAddress(zip: string, houseNumber: string, bagOptions: IBagOptions, callback: Function): void;
}
