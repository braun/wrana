const Collection = require("./collection");
const mongo = require("mongodb");


class RestServiceGroup
{
    constructor(app,options)
    {
        this.app = app;
        this.options = options;
    }

    async addService(key,def)
    {
        var rv = new RestMongoCollectionService(this.app,key,def);
        await rv.init();
    }

}

class RestMongoCollectionService
{
    constructor(app, colName,def)
    {
        this.colName = colName;
        this.def = def;
        this.app = app;
    }

    async init()
    {
        this.collection = new Collection(this.colName,this.app.database.database);
        await this.collection.init();
        restifyCollection(this.collection,this.app,this.def);
    }
}

require('./appservices').serviceTypes['rest'] = RestServiceGroup;
/**
 * Restifies the collection (installs GET,PUT,POST,DELETE middlewares to specified Express App)
 * @param {Collection} collection 
 * @param {Express.Application} expressApp 
 */
function restifyCollection(collection,expressApp,opts)
{
    if(opts == null)
     opts = {}
    if(opts.mountPointBase == null)
        opts.mountPointBase = "/api";

    var mountPoint = opts.mountPointBase+"/"+collection.colName;

    expressApp.get(mountPoint+"/:id",async (req,res,next)=>
    {
        var id = req.params.id;
        var result = await collection.findById(id);
        res.send(result);
    });

    expressApp.get(mountPoint,async (req,res,next)=>
    {
        var list = await collection.find({});
        list.toArray((error, result) => {
            if(error) {
                return res.status(500).send(error);
            }
            res.send(result);
        });
    });
   
    expressApp.put(mountPoint,async (req,res,next)=>
    {
        try
        {
            var doc = req.body;
            var rv = await collection.save(doc);
            res.status(200).send(rv);
        }
        catch(err)
        {
            console.error("restCollection.put "+collection.colName,err);
            res.status(500).send(err);
        }
    });
    expressApp.post(mountPoint,async (req,res,next)=>
    {
        try
        {
            var doc = req.body;
           var rv =  await collection.save(doc);
            res.status(200).send(rv);
        }
        catch(err)
        {
            console.error("restCollection.put "+collection.colName,err);
            res.status(500).send(err);
        }
    });
}

module.exports.restifyCollection = restifyCollection;