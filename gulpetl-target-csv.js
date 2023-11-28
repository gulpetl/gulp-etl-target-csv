// const targetCsv = require('./src/plugin'); // Error: Cannot find module './src/plugin'
// import { csvStringifyNdjson } from 'gulp-etl-target-csv'; // SyntaxError: Cannot use import statement outside a module (line:2)
const targetCsv = require('gulp-etl-target-csv');

module.exports = function (RED) {
  function TargetCsvNode(config) {
    RED.nodes.createNode(this, config);
    var node = this;
    node.on('input', function (msg) {
      targetCsv.csvStringifyNdjson(msg.payload, msg.config)
        .then((data) => {
          msg.payload = data;
        })
        .catch((err) => {
          node.error(err.message);
        })
        .finally(() => {
          node.send(msg);
        })
    })
  }

  RED.nodes.registerType("gulpetl-target-csv", TargetCsvNode);
}