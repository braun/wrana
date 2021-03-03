const express = require('express')
const app = express()
var port =  process.env.EXPRESS_PORT; 
const DB_CONNECTION_STRING = process.env.DB_CONNECTION_STRING;
const DATABASE_NAME = process.env.DATABASE_NAME;

var flash = require('connect-flash');


//var multer = require('multer');
//var upload = multer();
//const BodyParser = require("body-parser");
const MongoClient = require("mongodb").MongoClient;
const ObjectId = require("mongodb").ObjectID;

var database;

const Collection = require('./db/collection');
const { restifyCollection } = require('./db/restCollection');
const Users = require('./db/users');
const wi18next = require('./wi18next');

if(port == null)
    port = 8080;
    
if(DB_CONNECTION_STRING == null)
    throw "Set DB_CONNECTION_STRING"


if(DATABASE_NAME == null)
    throw "Set DATABASE_NAME"

app.use(express.json());
app.use(express.urlencoded());
app.use(flash());

// session management
var session =require('express-session');
var MongoDBStore = require('connect-mongodb-session')(session);
var store = new MongoDBStore({
  uri: DB_CONNECTION_STRING,
  databaseName: DATABASE_NAME,
  collection: 'sessions'
});
   
// Catch errors
store.on('error', function(error) {
  console.error("SESSION STORE: "+error);
});
app.use(session({
  secret: 'ZAM7401',
  cookie: {
    maxAge: 1000 * 60 * 60 * 24 * 7 // 1 week
  },
  store: store,
  // Boilerplate options, see:
  // * https://www.npmjs.com/package/express-session#resave
  // * https://www.npmjs.com/package/express-session#saveuninitialized
  resave: true,
  saveUninitialized: true
}));


async function mongoApi() {
  var rv = { collections: {} };
  var client = await MongoClient.connect(DB_CONNECTION_STRING, { useNewUrlParser: true });

  var database = client.db(DATABASE_NAME);
  console.log("Connected to `" + DATABASE_NAME + "`!");

  rv.database = database; 
  return rv;
}


async function initApp()
{
  database = await mongoApi();
  app.database = database;

  wi18next.init(app);
  
  //user management
  await require('./usermngmt')(app);
  //application endpoints
  await require('./db/appservices').init(app);


  //serve browser app
  app.use('/',express.static('../app'))
  app.use('/',express.static('../hejlfram'))
  app.use('/webcommons',express.static('webcommons'))
  app.use('/',express.static('app'))
  app.use('/',express.static('hejlfram'))
  app.use('/webcommons',express.static('wrana/webcommons'))

}

initApp().then(()=>
{
  //run express on port
  app.listen(port,async () => {
  console.log(`App listening at http://localhost:${port}`)
  })
}).catch(reason=>
  {
    console.error("failed to init app",reason);
  })
