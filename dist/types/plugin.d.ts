export declare const PLUGIN_NAME: any;
export declare let localDefaultConfigObj: any;
/**
 * Parse a [Message Stream](https://docs.gulpetl.com/concepts/message-streams) RECORD line into an object (if needed) and then return
 * the `record` property, or return null if no `record` exists (e.g. for a STATE line); if we were called by a transform stream,
 * [null tells it to skip this line](https://csv.js.org/transform/handler/#skipping-records)
 * @param messageLine A string representation of a Message Stream line, or an object version of same
 * @returns messageLine.record, or, if null if messageLine.record doesn't exist
 */
export declare function extractRecordObjFromMessageString(messageLine: string | object): object | null;
/**
 * Converts an [jsonl](https://jsonlines.org/) input into an array of objects and passes the array to csvStringify for conversion to CSV
 * @param jsonlLines May be a string or Buffer representing jsonl lines, or an array of json strings or an array of objects
 * @param configObj [CSV Stringify options object](https://csv.js.org/stringify/options/); optional
 * @returns A string representation of the CSV lines
 */
export declare function csvStringifyJsonl(jsonlLines: string | Buffer | Array<string> | Array<object>, configObj?: Object): Promise<string>;
export declare function targetCsv(origConfigObj: any): any;
