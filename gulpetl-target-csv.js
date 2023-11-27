// import { extractRecordObjFromMessageString } from './src/plugin';
function extractRecordObjFromMessageString (messageStr) {    
    if (messageStr.trim() == "") return null;
    
    let recordObj;
    try {
      recordObj = JSON.parse(messageStr);
      // log.debug(messageStr);
    } 
    catch (err) {
      throw new Error("failed to parse with error: '" + err.message + "':\n" + messageStr);
    }
      
    return recordObj.record
  }
const csvStringify = require('csv-stringify');

module.exports = async function(RED) {
    function TargetCsvNode(config) {
        RED.nodes.createNode(this,config);
        var node = this;
        node.on('input', function(msg) {
            msg.payload = msg.payload.toLowerCase();

            const linesArray = (msg.payload/* as Buffer*/).toString().split('\n');
            let recordObjectArr = [];
            // call extractRecordObjFromMessageString on each line
            for (let dataIdx in linesArray) {
              let tempLine = extractRecordObjFromMessageString(linesArray[dataIdx]);
              if (!tempLine) 
                continue;
    
              recordObjectArr.push(tempLine);
            }
    
            // csvStringify(recordObjectArr, configObj)
            csvStringify(recordObjectArr, {}, function (err, data) {
              // this callback function runs when the stringify finishes its work, returning an array of CSV lines
              if (err) returnErr = new PluginError(PLUGIN_NAME, err)
              else msg.payload = data;//Buffer.from(data)
    
              // we are done with file processing. Pass the processed file along
              // log.debug('calling callback')
              // cb(returnErr, file);
            })
            
            node.send(msg);
        });
    }
    RED.nodes.registerType("gulpetl-target-csv",TargetCsvNode);
}