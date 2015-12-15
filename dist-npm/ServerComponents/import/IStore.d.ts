import express = require('express');
interface IStore {
    /**
     * Save all importers.
     */
    save(id?: string, resource?: any): any;
    /**
     * Get a single importer.
     */
    get(id: string): Object;
    getAsync?(id: string, res: express.Response): any;
    /**
     * Get all importers as an array.
     */
    getAll(): Object[];
    /**
     * Delete an existing importer.
     */
    delete(id: string): any;
    /**
     * Create a new importer and store it.
     */
    create(id: string, resource: any): any;
    /**
     * Update an existing importer.
     */
    update(id: string, resource: any): any;
}
export = IStore;
