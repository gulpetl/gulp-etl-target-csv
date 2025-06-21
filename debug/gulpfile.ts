let gulp = require('gulp')
import { targetCsv } from '../src/plugin'

import * as loglevel from 'loglevel'
const log = loglevel.getLogger('gulpfile')
log.setLevel((process.env.DEBUG_LEVEL || 'warn') as loglevel.LogLevelDesc)
// if needed, you can control the plugin's logging level separately from 'gulpfile' logging above
// const pluginLog = loglevel.getLogger(PLUGIN_NAME)
// pluginLog.setLevel('debug')

// const errorHandler = require('gulp-error-handle'); // handle all errors in one handler, but still stop the stream if there are errors

const pkginfo = require('pkginfo')(module); // project package.json info into module.exports
const PLUGIN_NAME = module.exports.name;

import Vinyl from 'vinyl'

let gulpBufferMode = false;

function switchToBuffer(callback: any) {
  gulpBufferMode = true;

  callback();
}

/**
 * Run this plugin under gulp, in either "streaming" or "buffer" mode depending on `gulpBufferMode`,
 * which is used to set the `buffer` option passed to [gulp.src](https://gulpjs.com/docs/en/api/src#options)
 * @param callback gulp passes in this callback; we can call it when our stream is set up, but instead we return the stream itself
 * @returns the gulp stream we've set up (which is probably not finished); learn about [gulp async completion](https://gulpjs.com/docs/en/getting-started/async-completion)
 */
function runtargetCsv(callback: any) {
  log.info('gulp task starting for ' + PLUGIN_NAME)

  return gulp.src('../testdata/*.jsonl', { buffer: gulpBufferMode })
    .on('data', function (file: Vinyl) {
      log.info('Adding options via gulp-data API (file.data) to ' + file.basename + "...")
      file.data = { header: false }
    })
    .on('data', function (file: Vinyl) {
      log.info('...or, setting file.data this way allows you to set options for multiple plugins in the same pipeline without conflicts')
      let allOptions = file.data || {}; // set allOptions to existing file.data or, if none exists, set to an empty object
      allOptions["gulp-etl-target-csv"] = { header: true }; // set options on file.data for a specific plugin. This will override the more general settings above.
    })
    .on('data', function (file: Vinyl) {
      log.info('Starting processing on ' + file.basename)
    })
    .pipe(targetCsv({ quoted_string: true, header: false })) // header value here overridden by file.data settings
    // errorHandler isn't working..? For now we use ".on('error')"
    // .pipe(errorHandler(function (err: any) {
    //   log.error('Error: ' + err)
    //   callback(err)
    // }))
    .on('error', function (err: any) {
      log.error('OOPS! ' + err)
    })
    .pipe(gulp.dest('../testdata/processed'))
    .on('data', function (file: Vinyl) {
      log.info('Finished processing on ' + file.basename)
    })
    .on('end', function () {
      log.info('gulp task complete')
    })

  // callback(); // we could call callback, but we've returned the stream instead; see https://gulpjs.com/docs/en/getting-started/async-completion
}

exports.default = gulp.series(runtargetCsv)
exports.runtargetCsvBuffer = gulp.series(switchToBuffer, runtargetCsv)