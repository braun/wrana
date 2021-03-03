const { DataStore,DataFile } = require('./datastore')
const { doHttpRequest } = require('../httphelper')

class DataStoreRest extends DataStore
{
    constructor(options)
    {
        if(options == null)
            options  = {
                urlBase:"api"
            }
      super(options)
    }
  
    getDocumentTransformer()
    {
        return jsonDocumentRestTransformer;
    }
    getUrlBase()
    {
        if(this.options.urlBase == null)
            this.options.urlBase = "api"
        return this.options.urlBase;
    }

    newDataFile(fileName)
    {
        return new DataFileRest(this,fileName);
    }

}

class DataFileRest extends DataFile
{
    constructor(dataStore,fileName)
    {
       super(dataStore,fileName)
    }
    
   getDocumentTranformer()
   {
       return jsonDocumentRestTransformer;
   }
    getUrlBase(id)
    {
        var url = this.dataStore.getUrlBase()+"/"+this.fileName;  
        if(id != null)
            url += "/"+id;
        return url;
    }
    
    async listInternal(options)
    {
        var url = this.getUrlBase();
        return await doHttpRequest(url);
    }
    async findByIdInternal(id)
    {
        var url = this.getUrlBase(id);
        return await doHttpRequest(url);
    }

    async saveInternal(data,id)
    {
       
        var url = this.getUrlBase(id);
        var resdata = await doHttpRequest(url,
            {
                method:id == null ? "POST":"PUT",
                data: data,
                headers: {'Content-Type':this.transformer.contentType(data)}
            });
       return resdata;
    }

}

const jsonDocumentRestTransformer = 
{
    extractId: (doc)=>
    {
        return doc._id;
    },
    transformResult: (data)=>
    {
        var rv = JSON.parse(data);
        return rv;
    },
    transformInput: (data)=>
    {
        if(typeof data == "object")
           return JSON.stringify(data,null,2);
        return data;
    },
    contentType:(data)=>
    {
        return "application/json"
    },
    updateAfterSave(data,rv)
    {
        if(data._id == null)
            data._id = rv.id;
    }
}


DataStore.restApi = function(options)
{
    return new DataStoreRest(options);
}
DataStore._storeTypes["rest"] = DataStore.restApi;

module.exports.DataStoreRest = DataStoreRest;
module.exports.DataFileRest = DataFileRest;