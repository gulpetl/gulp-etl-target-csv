import { extractRecordObjFromMessageString } from '../src/plugin'

/**
 * Run this plugin on an .jsonl file, converting it to a .csv file. As a wrapper for csv-stringify, the only real logic
 * in this plugin in `extractRecordObjFromMessageString`, which parses incoming string lines into objects and returns 
 * only the part of the object that csv-stringify should export.
 * 
 * We demonstrate here that a gulp plugin can run without gulp. We operate here in "streaming" mode, working with the
 * nodejs stream provided by createReadStream.
 */
export function runWithoutGulp() {
    const split = require('split2');
    const csvStringify = require('csv-stringify');
    const transform = require('stream-transform')

    return require('fs').createReadStream('./testdata/cars.jsonl', { encoding: "utf8" })
        .pipe(split()) // split the stream into individual lines
        .on("data", (data: any) => {
            console.log(data)
        })
        // use a node transform stream to parse each line into an object and extract its main `record` property
        .pipe(transform(extractRecordObjFromMessageString))
        .on("error", (data: any) => {
            console.error(data.message)
        })
        .pipe(csvStringify())
        .on("data", (data: any) => {
            console.log((data as Buffer).toString().trim())
        });
}

runWithoutGulp();
