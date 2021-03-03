var i18next = require('i18next')
var middleware = require('i18next-http-middleware')
var express = require('express')
var ejs = require('ejs');

function init(app)
{
    i18next.use(middleware.LanguageDetector).init({
    preload: ['cs','en'],
    //...otherOptions
    })

    
    app.use(
    middleware.handle(i18next, {
      //  ignoreRoutes: ['/foo'] // or function(req, res, options, i18next) { /* return true to ignore */ }
    })
    )

    // in your request handler
    // app.get('myRoute', (req, res) => {
    // var lng = req.language // 'de-CH'
    // var lngs = req.languages // ['de-CH', 'de', 'en']
    // req.i18n.changeLanguage('en') // will not load that!!! assert it was preloaded

    // var exists = req.i18n.exists('myKey')
    // var translation = req.t('myKey')
    // })

    ejs.filters.t = function(key) {
        return i18n.t(key);
      };
}
module.exports.init = init;

// in your views, eg. in pug (ex. jade)
//div = t('myKey')