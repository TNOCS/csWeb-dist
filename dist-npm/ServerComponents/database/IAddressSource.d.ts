import IBagOptions = require('../database/IBagOptions');
export interface IAddressSource {
    name: string;
    init(): void;
    searchAddress?(query: string, limit: number, callback: (searchResults: any) => void): void;
    searchGemeente?(query: string, limit: number, callback: (searchResults: any) => void): void;
    lookupBagArea?(bounds: string, isArea: boolean, callback: Function): any;
    lookupBagBuurt?(bounds: string, isArea: boolean, callback: Function): any;
    lookupBagAddress?(zip: string, houseNumber: string, bagOptions: IBagOptions, callback: Function): any;
    lookupBagCity?(city: string, callback: Function): any;
}
