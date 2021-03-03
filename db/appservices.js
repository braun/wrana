
var serviceTypes = {}
module.exports.serviceTypes = serviceTypes;

module.exports.init = async function(app)
{
    var {dataFiles} = require('../../app/datafiles');
    for(var skey in dataFiles)
    {
        var serviceGroupDef  = dataFiles[skey];
        var serviceGroup= createService(serviceGroupDef.type,serviceGroupDef.options);
        if(serviceGroup == null)
            continue;

        for(var key in serviceGroupDef.files)
        {
            var serviceDef = serviceGroupDef.files[key];
            var service = await serviceGroup.addService(key,serviceDef);
            
        }
    }
   
    
    function createService(type,options)
    {
        var serviceClazz = serviceTypes[type];
        if(serviceClazz == null)
            return null;
        var instance = new serviceClazz(app,options);
        return instance;
    }
}




