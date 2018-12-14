/** Create a new GUID */
export declare function newGuid(): string;
export declare function S4(): string;
/** Get all the directories in a folder. */
export declare function getDirectories(srcpath: string): string[];
/** Get all the files in a folder. */
export declare function getFiles(srcpath: string): string[];
/**
 * Get the IP4 address (assuming you have only one active network card).
 * See also: http://stackoverflow.com/a/15075395/319711
 */
export declare function getIPAddress(): string;
