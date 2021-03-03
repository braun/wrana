var mongo = require("mongodb");
class Collection
{
    constructor(colName,db)
    {
        this.colName = colName;
        this.db = db;
       
    }

    prepareId(id)
    {
        var rv = typeof id == "string" ? new mongo.ObjectID(id): id;
        return rv;
    }

    async init()
    {
        this.collection = this.db.collection(this.colName);
    }

    async findById(id)
    {
        id = this.prepareId(id);
        var doc = await this.collection.findOne({ '_id':id});
        return doc;
    }
    async find(filter)
    {
        var rv = await this.collection.find(filter);
        return rv;
    }
    async exists(id)
    {
        id = this.prepareId(id);
        var c = this.collection.find({_id:id },{limit:1});
        var cnt = await c.count();
        return cnt > 0;
    }
    async save(doc)
    {
        var rv = {};
        if(doc._id)
        {
            doc._id = this.prepareId(doc._id);
        
            var res = await this.collection.replaceOne({ _id: doc._id },doc,
            {
                upsert:true
            });
            rv.id = doc._id;
        } else
            {
                var res = await this.collection.insertOne(doc);
                 rv.id =  res.insertedId;
            }
        return rv;        
    }
}

module.exports = Collection;