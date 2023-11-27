"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.targetCsv = exports.csvStringifyNdjson = exports.extractRecordObjFromMessageString = void 0;
const through2 = require('through2');
const PluginError = require("plugin-error");
const pkginfo = require('pkginfo')(module); // project package.json info into module.exports
const PLUGIN_NAME = module.exports.name;
const loglevel_1 = require("loglevel");
const log = loglevel_1.default.getLogger(PLUGIN_NAME); // get a logger instance based on the project name
log.setLevel((process.env.DEBUG_LEVEL || 'warn'));
const replaceExt = require("replace-ext");
const csvStringify = require('csv-stringify');
const split = require('split2');
const transform = require('stream-transform');
const merge_1 = require("merge");
/**
 * Parse a [Message Stream](https://docs.gulpetl.com/concepts/message-streams) RECORD line into an object (if needed) and then return
 * the `record` property, or return null if no `record` exists (e.g. for a STATE line); if we were called by a transform stream,
 * [null tells it to skip this line](https://csv.js.org/transform/handler/#skipping-records)
 * @param messageLine A string representation of a Message Stream line, or an object version of same
 * @returns messageLine.record, or, if null if messageLine.record doesn't exist
 */
function extractRecordObjFromMessageString(messageLine) {
    let recordObj;
    if (typeof (messageLine) != "string")
        recordObj = messageLine; // since it's not a string, we assume messageLine is an object already
    else {
        if (messageLine.trim() == "")
            return null;
        try {
            recordObj = JSON.parse(messageLine);
            log.debug(messageLine);
        }
        catch (err) {
            throw new Error("failed to parse with error: '" + err.message + "':\n" + messageLine);
        }
    }
    return recordObj.record || null; // if record doesn't exist, we return null
}
exports.extractRecordObjFromMessageString = extractRecordObjFromMessageString;
/**
 * Converts an [ndjson](https://ndjson.org/) input into an array of objects and passes the array to csvStringify for conversion to CSV
 * @param ndjsonLines May be a string or Buffer representing ndjson lines, or an array of json strings or an array of objects
 * @param configObj [CSV Stringify options object](https://csv.js.org/stringify/options/); optional
 * @returns A string representation of the CSV lines
 */
function csvStringifyNdjson(ndjsonLines, configObj = {}) {
    return new Promise((resolve, reject) => {
        try {
            let linesArray;
            let recordObjectArr = [];
            if (Buffer.isBuffer(ndjsonLines))
                linesArray = ndjsonLines.toString().split('\n');
            else if (typeof (ndjsonLines) == "string")
                linesArray = ndjsonLines.split('\n');
            else
                linesArray = ndjsonLines; // should be an array of strings or objects
            // call extractRecordObjFromMessageString on each line
            for (let dataIdx in linesArray) {
                let tempLine = extractRecordObjFromMessageString(linesArray[dataIdx]);
                if (tempLine)
                    recordObjectArr.push(tempLine);
            }
            csvStringify(recordObjectArr, configObj, function (err, data) {
                // this callback function runs when csvStringify finishes its work; data is a string containing CSV lines
                log.debug("csv-stringify data:", data);
                if (err)
                    reject(new PluginError(PLUGIN_NAME, err));
                else
                    resolve(data);
            });
        }
        catch (err) {
            reject(new PluginError(PLUGIN_NAME, err));
        }
    });
}
exports.csvStringifyNdjson = csvStringifyNdjson;
/* This is a gulp-etl plugin. It is compliant with best practices for Gulp plugins (see
https://github.com/gulpjs/gulp/blob/master/docs/writing-a-plugin/guidelines.md#what-does-a-good-plugin-look-like ),
and like all gulp-etl plugins it accepts a configObj as its first parameter */
function targetCsv(origConfigObj) {
    // creating a stream through which each file will pass - a new instance will be created and invoked for each file 
    // see https://stackoverflow.com/a/52432089/5578474 for a note on the "this" param
    const strm = through2.obj(function (file, encoding, cb) {
        let configObj;
        try {
            if (file.data) {
                // look for a property based on our plugin's name; assumes a complex object meant for multiple plugins
                let dataObj = file.data[PLUGIN_NAME];
                // if we didn't find a config above, use the entire file.data object as our config
                if (!dataObj)
                    dataObj = file.data;
                // merge file.data config into our passed-in origConfigObj
                // merge.recursive(origConfigObj, dataObj); // <-- huge bug: can't mess with origConfigObj, because changes there will bleed into subsequent calls
                configObj = merge_1.default.recursive(true, origConfigObj, dataObj);
            }
            else
                configObj = merge_1.default.recursive(true, origConfigObj);
        }
        catch { }
        if (configObj.header === undefined)
            configObj.header = true; // we default header to true, the expected default behavior for general usage
        const self = this;
        let returnErr = null;
        file.path = replaceExt(file.path, '.csv');
        if (file.isNull() || returnErr) {
            // return empty file
            return cb(returnErr, file);
        }
        else if (file.isBuffer()) {
            csvStringifyNdjson(file.contents, configObj)
                .then((data) => {
                file.contents = Buffer.from(data);
            })
                .catch((err) => {
                returnErr = new PluginError(PLUGIN_NAME, err);
            })
                .finally(() => {
                // we are done with file processing. Pass the processed file along
                log.debug('calling callback');
                cb(returnErr, file);
            });
        }
        else if (file.isStream()) {
            file.contents = file.contents
                // split plugin will split the file into lines
                .pipe(split())
                // use a node transform stream to parse each line into an object and extract its main `record` property
                .pipe(transform(extractRecordObjFromMessageString))
                .on('end', function () {
                // DON'T CALL THIS HERE. It MAY work, if the job is small enough. But it needs to be called after the stream is SET UP, not when the streaming is DONE.
                // Calling the callback here instead of below may result in data hanging in the stream--not sure of the technical term, but dest() creates no file, or the file is blank
                // cb(returnErr, file);
                // log.debug('calling callback')    
                log.debug('csv parser is done');
            })
                // .on('data', function (data:any, err: any) {
                //   log.debug(data)
                // })
                .on('error', function (err) {
                log.error(err);
                self.emit('error', new PluginError(PLUGIN_NAME, err));
            })
                .pipe(csvStringify(configObj));
            // after our stream is set up (not necesarily finished) we call the callback
            log.debug('calling callback');
            cb(returnErr, file);
        }
    });
    return strm;
}
exports.targetCsv = targetCsv;
//# sourceMappingURL=plugin.js.map