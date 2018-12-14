import IBagOptions = require('../database/IBagOptions');
export interface IAddressSource {
    init(): void;
    searchAddress(query: string, limit: number, callback: (searchResults) => void): void;
    searchGemeente(query: string, limit: number, callback: (searchResults) => void): void;
    lookupBagArea(bounds: string, isArea: boolean, callback: Function): any;
    lookupBagBuurt(bounds: string, isArea: boolean, callback: Function): any;
    lookupBagAddress(zip: string, houseNumber: string, bagOptions: IBagOptions, callback: Function): any;
}
