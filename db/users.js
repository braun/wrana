
var Collection = require("./collection");

class Users extends Collection
{
   constructor(db,cb)
  {
    super('users',db,cb);
   
  }

  async init()
  {
    await super.init();
    await this.collection.createIndexes([
      { key: { 'email':1}, name: 'email'}
    ]);
  }

  prepareId(id)
  {
    return id;
  }
}

module.exports = Users;
