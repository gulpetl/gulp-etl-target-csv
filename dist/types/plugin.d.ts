/// <reference types="node" />
/**
 * Parse a [Message Stream](https://docs.gulpetl.com/concepts/message-streams) RECORD line into an object (if needed) and then return
 * the `record` property, or return null if no `record` exists (e.g. for a STATE line); if we were called by a transform stream,
 * [null tells it to skip this line](https://csv.js.org/transform/handler/#skipping-records)
 * @param messageLine A string representation of a Message Stream line, or an object version of same
 * @returns messageLine.record, or, if null if messageLine.record doesn't exist
 */
export declare function extractRecordObjFromMessageString(messageLine: string | object): object | null;
/**
 * Merges config information for this plugin from all potential sources
 * @param specificConfigObj A configObj set specifically for this plugin
 * @param pipelineConfigObj A "super" configObj (e.g. file.data or msg.config) for the whole pipeline which may/may not apply to this plugin; if it
 * does, its parameters override any matching ones from specificConfigObj.
 * @param defaultConfigObj A default configObj, whose parameters are overridden by all others
 */
export declare function extractConfig(specificConfigObj: any, pipelineConfigObj?: any, defaultConfigObj?: any): any;
/**
 * Converts an [ndjson](https://ndjson.org/) input into an array of objects and passes the array to csvStringify for conversion to CSV
 * @param ndjsonLines May be a string or Buffer representing ndjson lines, or an array of json strings or an array of objects
 * @param configObj [CSV Stringify options object](https://csv.js.org/stringify/options/); optional
 * @returns A string representation of the CSV lines
 */
export declare function csvStringifyNdjson(ndjsonLines: string | Buffer | Array<string> | Array<object>, configObj?: Object): Promise<string>;
export declare function targetCsv(origConfigObj: any): any;
