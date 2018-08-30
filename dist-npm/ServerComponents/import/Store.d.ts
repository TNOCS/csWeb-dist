import express = require('express');
import IStore = require("./IStore");
export declare class FileStore implements IStore {
    private store;
    private resources;
    constructor(opt?: {
        [key: string]: any;
    });
    /**
     * Load the file from disk.
     */
    private load;
    /**
     * Save the list of importers to disk.
     */
    save(): void;
    /**
     * Get all importers as an array.
     */
    getAll(): Object[];
    /**
     * Get a single importer.
     */
    get(id: string): any;
    /**
     * Create a new importer and store it.
     */
    create(id: string, newObject: any): void;
    /**
     * Delete an existing importer.
     */
    delete(id: string): any;
    /**
     * Update an existing importer.
     */
    update(id: string, resource: any): void;
}
export declare class FolderStore implements IStore {
    private folder;
    private resources;
    constructor(opt?: {
        [key: string]: any;
    });
    /**
     * Load the file from disk.
     */
    private load;
    save(id: string, resource: any): void;
    /**
     * Get all importers as an array.
     */
    getAll(): string[];
    /**
     * Get a single resource.
     */
    get(id: string): string;
    /**
     * Get a single resource.
     */
    getAsync(id: string, res: express.Response): void;
    /**
     * Create a new importer and store it.
     */
    create(id: string, resource: any): void;
    /**
     * Delete an existing importer.
     */
    delete(id: string): any;
    /**
     * Update an existing resource.
     */
    update(id: string, resource: any): void;
}
