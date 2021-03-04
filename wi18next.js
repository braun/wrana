var i18next = require('i18next')
var middleware = require('i18next-http-middleware')
var express = require('express')
var ejs = require('ejs');
var FilesystemBackend = require('i18next-fs-backend');

function init(app)
{
    i18next.use(middleware.LanguageDetector)
    .use(FilesystemBackend)
    .init({
    preload: ['cs','en'],
    ns: ['common','app'],
    defaultNS:"common",
    saveMissing:true,
    debug:true,
    backend:{
      // path where resources get loaded from, or a function
      // returning a path:
      // function(lngs, namespaces) { return customPath; }
      // the returned path will interpolate lng, ns if provided like giving a static path
      loadPath: function(){
        return __dirname +'/locales/{{lng}}/{{ns}}.json'
      },
    
      // path to post missing resources
      addPath: __dirname +'/locales/add/{{lng}}/{{ns}}.missing.json',
    
      // if you use i18next-fs-backend as caching layer in combination with i18next-chained-backend, you can optionally set an expiration time
      // an example on how to use it as cache layer can be found here: https://github.com/i18next/i18next-fs-backend/blob/master/example/caching/app.js
      // expirationTime: 60 * 60 * 1000}
    //...otherOptions
    }
  },(err, t) => {
   
   
 
  //  i18next.changeLanguage('cs');
  //  var login = i18next.t('Login'); // key in moduleA namespace (defined default)
    
    // in your request handler
    // app.get('myRoute', (req, res) => {
    // var lng = req.language // 'de-CH'
    // var lngs = req.languages // ['de-CH', 'de', 'en']
    // req.i18n.changeLanguage('en') // will not load that!!! assert it was preloaded

    // var exists = req.i18n.exists('myKey')
    // var translation = req.t('myKey')
    // })
 ejs.locals = app.locals;
    app.locals.t = function(key) {
      if(typeof key !== 'string')
          return key;
        return i18next.t(key);
      };

      // missing keys make sure the body is parsed (i.e. with [body-parser](https://github.com/expressjs/body-parser#bodyparserjsonoptions))
      app.post('/locales/add/:lng/:ns', middleware.missingKeyHandler(i18next))

      // multiload backend route
      app.get('/locales/resources.json', middleware.getResourcesHandler(i18next))


    
    });
    app.use(
      middleware.handle(i18next, {
        //  ignoreRoutes: ['/foo'] // or function(req, res, options, i18next) { /* return true to ignore */ }
     
      }));
      app.use(async (req,res,next)=>
      {
        var lng = req.language // 'de-CH'
      var lngs = req.languages // ['de-CH', 'de', 'en']
      res.language = lng;
      res.i18n=req.i18n;
   //   req.i18n.changeLanguage('cs') // will not load that!!! assert it was preloaded
      next();
      });
}
module.exports.init = init;

// in your views, eg. in pug (ex. jade)
//div = t('myKey')