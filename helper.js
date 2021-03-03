const fs = require('fs');

function readStringSync(file)
{
    var rv = fs.readFileSync(__dirname +"/"+ file,{encoding:'UTF-8'});
    return rv;
}

module.exports.readStringSync = readStringSync;