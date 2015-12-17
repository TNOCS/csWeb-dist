import Location = require('./Location');
import IBagOptions = require('../database/IBagOptions');
/**
 * Export a connection to the BAG database.
 */
export declare class LocalBag {
    private connectionString;
    private db;
    constructor(path: string);
    /**
     * Format the zip code so spaces are removed and the letters are all capitals.
     */
    private formatZipCode(zipCode);
    /**
     * Expect the house number format in NUMBER-LETTER-ADDITION
     */
    private splitAdressNumber(input);
    /**
     * Format the house number such that we keep an actual number, e.g. 1a -> 1.
     */
    private formatHouseNumber(input);
    /**
     * Format the house letter, max 1 character and in uppercase.
     */
    private formatHouseLetter(input);
    /**
     * Format the housenumber addition and in uppercase.
     */
    private formatHouseNumberAddition(input);
    lookupBagArea(bounds: string, callback: (areas: Location[]) => void): void;
    /**
     * Lookup the address from the BAG.
     */
    lookupBagAddress(zip: string, houseNumber: string, bagOptions: IBagOptions, callback: (addresses: Location[]) => void): void;
    private indexes(source, find);
}
