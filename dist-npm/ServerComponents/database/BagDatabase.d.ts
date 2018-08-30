import express = require('express');
import ConfigurationService = require('../configuration/ConfigurationService');
import Location = require('./Location');
import IBagOptions = require('../database/IBagOptions');
import IAddressSource = require('../database/IAddressSource');
/**
 * Export a connection to the BAG database.
 */
export declare class BagDatabase implements IAddressSource.IAddressSource {
    private connectionString;
    private isInitialized;
    private pg;
    private pgPool;
    name: string;
    constructor(config: ConfigurationService.ConfigurationService);
    init(): void;
    /**
     * Format the zip code so spaces are removed and the letters are all capitals.
     */
    private formatZipCode;
    /**
     * Expect the house number format in NUMBER-LETTER-ADDITION
     */
    private splitAdressNumber;
    /**
     * Format the house number such that we keep an actual number, e.g. 1a -> 1.
     */
    private formatHouseNumber;
    /**
     * Format the house letter, max 1 character and in uppercase.
     */
    private formatHouseLetter;
    /**
     * Format the housenumber addition and in uppercase.
     */
    private formatHouseNumberAddition;
    searchAddress(query: string, limit: number, callback: (searchResults: any) => void): void;
    searchGemeente(query: string, limit: number, callback: (searchResults: any) => void): void;
    lookupBagArea(bounds: string, isArea: boolean, callback: (areas: Location[]) => void): void;
    lookupBagBuurt(bounds: string, isArea: boolean, callback: (areas: Location[]) => void): void;
    /**
     * Lookup the address from the BAG.
     */
    lookupBagAddress(zip: string, houseNumber: string, bagOptions: IBagOptions, callback: (addresses: Location[]) => void): void;
    private indexes;
    /**
     * Lookup the address from the BAG.
     */
    lookupAddress(req: express.Request, res: express.Response): void;
}
