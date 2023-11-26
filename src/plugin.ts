const through2 = require('through2')
import Vinyl = require('vinyl')
import PluginError = require('plugin-error');
const pkginfo = require('pkginfo')(module); // project package.json info into module.exports
const PLUGIN_NAME = module.exports.name;
import * as loglevel from 'loglevel'
const log = loglevel.getLogger(PLUGIN_NAME) // get a logger instance based on the project name
log.setLevel((process.env.DEBUG_LEVEL || 'warn') as loglevel.LogLevelDesc)
import replaceExt = require('replace-ext')

const csvStringify = require('csv-stringify')
const split = require('split2')
const transform = require('stream-transform')
import merge from 'merge';


/** parse a MessageStream RECORD text line into an object and return the `record` property */
export function extractRecordObjFromMessageString (messageStr: string) : object | null {    
  if (messageStr.trim() == "") return null;
  
  let recordObj;
  try {
    recordObj = JSON.parse(messageStr);
    log.debug(messageStr);
  } 
  catch (err: any) {
    throw new Error("failed to parse with error: '" + err.message + "':\n" + messageStr);
  }
    
  return recordObj.record
}

/* This is a gulp-etl plugin. It is compliant with best practices for Gulp plugins (see
https://github.com/gulpjs/gulp/blob/master/docs/writing-a-plugin/guidelines.md#what-does-a-good-plugin-look-like ),
and like all gulp-etl plugins it accepts a configObj as its first parameter */
export function targetCsv(origConfigObj: any) {

  // creating a stream through which each file will pass - a new instance will be created and invoked for each file 
  // see https://stackoverflow.com/a/52432089/5578474 for a note on the "this" param
  const strm = through2.obj(function (this: any, file: Vinyl, encoding: string, cb: Function) {

    let configObj;
    try {
      if (file.data) {
        // look for a property based on our plugin's name; assumes a complex object meant for multiple plugins
        let dataObj = file.data[PLUGIN_NAME];
        // if we didn't find a config above, use the entire file.data object as our config
        if (!dataObj) dataObj = file.data;
        // merge file.data config into our passed-in origConfigObj
        // merge.recursive(origConfigObj, dataObj); // <-- huge bug: can't mess with origConfigObj, because changes there will bleed into subsequent calls
        configObj = merge.recursive(true, origConfigObj, dataObj);
      }
      else
        configObj = merge.recursive(true, origConfigObj);
    }
    catch { }
    if (configObj.header === undefined) configObj.header = true // we default header to true, the expected default behavior for general usage

    const self = this
    let returnErr: any = null

    file.path = replaceExt(file.path, '.csv')

    if (file.isNull() || returnErr) {
      // return empty file
      return cb(returnErr, file)
    }
    else if (file.isBuffer()) {
      try {
        const linesArray = (file.contents as Buffer).toString().split('\n');
        let recordObjectArr = [];
        // call extractRecordObjFromMessageString on each line
        for (let dataIdx in linesArray) {
          let tempLine = extractRecordObjFromMessageString(linesArray[dataIdx]);
          if (!tempLine) 
            continue;

          recordObjectArr.push(tempLine);
        }

        csvStringify(recordObjectArr, configObj, function (err: any, data: string) {
          // this callback function runs when the stringify finishes its work, returning an array of CSV lines
          if (err) returnErr = new PluginError(PLUGIN_NAME, err)
          else file.contents = Buffer.from(data)

          // we are done with file processing. Pass the processed file along
          log.debug('calling callback')
          cb(returnErr, file);
        })
      }
      catch (err: any) {
        returnErr = new PluginError(PLUGIN_NAME, err);
        return cb(returnErr, file)
      }

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

          log.debug('csv parser is done')
        })
        // .on('data', function (data:any, err: any) {
        //   log.debug(data)
        // })
        .on('error', function (err: any) {
          log.error(err)
          self.emit('error', new PluginError(PLUGIN_NAME, err));
        })
        .pipe(csvStringify(configObj))

      // after our stream is set up (not necesarily finished) we call the callback
      log.debug('calling callback')
      cb(returnErr, file);
    }

  })

  return strm
}