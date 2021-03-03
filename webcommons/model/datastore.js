
class DataStore
{
    constructor(options)
    {
        if(options == null)
            options  = { }
        this.options = options;


        this.files = {};
    }
    addDataFile(fileName)
    {
        if(this.files[fileName] == null)
            this.files[fileName] = this.newDataFile(fileName);

        var rv = this.files[fileName];
        return rv;
    }
    addDocumentFile(filename)
    {
        var rv = this.addDataFile(filename);
        rv.setDocumentMode();
        return rv;
    }

    getDocumentTransformer()
    {
        return emptyTransformer;
    }
}

DataStore._storeTypes = {}
DataStore.create = function(storeType,options)
{
    var constructor = DataStore._storeTypes[storeType];
    if(constructor == null)
        return null;
    var rv = constructor(options);
    return rv;
}

class DataFile
{
    constructor(dataStore,fileName)
    {
        this.dataStore = dataStore;
        this.fileName = fileName;
        this.transformer = emptyTransformer;
    }

    setDocumentMode()
    {
        this.transformer = this.dataStore.getDocumentTransformer();
    }

    async list(options)
    {
       
        var data = await this.listInternal(options)
        var rv = await this.transformer.transformResult(data);
        return rv;
    }
    async findById(id)
    {
     
        var data = await this.findByIdInternal(id)
        var rv = await this.transformer.transformResult(data);
        return rv;
    }

    async save(data,id)
    {
        var payload = this.transformer.transformInput(data);
      
         
        if(id == null)
            id = this.transformer.extractId(data);
       
        var resdata = await this.saveInternal(payload,id);
         var rv = this.transformer.transformResult(resdata);
         if(this.transformer.updateAfterSave)
            this.transformer.updateAfterSave(data,rv);
        return rv;
    }

}


const emptyTransformer = 
{
    extractId: (data)=>
    {
        return null;
    },
    transformResult: (data)=>
    {
        return data;
    },
    transformInput: (data)=>
    {
        return data;
    }

};

module.exports.DataStore = DataStore;
module.exports.DataFile = DataFile;
module.exports.files = {};
module.exports.stores = {};

require("./datastoreRest");

const { dataFiles } = require('../../../app/datafiles');
for(var skey in dataFiles)
{
    var store  = dataFiles[skey];
    var inst = DataStore.create(store.type,store.options);
    module.exports.stores[skey] = inst;

    for(var key in store.files)
    {
         var file = store.files[key];
         var finst = file.type === 'document'
            ? inst.addDocumentFile(key,file)
            : inst.addDataFile(key,file)
        module.exports.files[key] = finst;
    }
}


