// const targetCsv = require('./src/plugin'); // Error: Cannot find module './src/plugin'
// import { csvStringifyJsonl } from 'gulp-etl-target-csv'; // SyntaxError: Cannot use import statement outside a module (line:2)
const targetCsv = require('gulp-etl-target-csv');
const extractConfig = require('@gulpetl/node-red-core').extractConfig;

module.exports = function (RED) {
  function TargetCsvNode(config) {
    RED.nodes.createNode(this, config);
    this.config = config.config;

    var node = this;

    node.on('input', function (msg, send, done) {
      let configObj;
      try {
        if (this.config.trim())
          configObj = JSON.parse(this.config);
      }
      catch (err) {
        done(`Unable to parse ${targetCsv.PLUGIN_NAME}.config: ` + err);
        return;
      }

      // console.log("targetCsv", targetCsv);
      configObj = extractConfig(configObj, msg?.config, targetCsv.PLUGIN_NAME, targetCsv.localDefaultConfigObj);

      if (!msg.topic?.startsWith("gulp")) {

        targetCsv.csvStringifyJsonl(msg.payload, configObj)
          .then((data) => {
            msg.payload = data;
          })
          .catch((err) => {
            node.error(err.message);
          })
          .finally(() => {
            node.send(msg);
          })
      }
      else {
        if (msg.topic == "gulp-initialize") {
          msg.plugins.push({ name: config.type, init: () => targetCsv.targetCsv(configObj) });
        }

        node.send(msg);
      }

    })
  }

  RED.nodes.registerType("gulpetl-target-csv", TargetCsvNode);
}