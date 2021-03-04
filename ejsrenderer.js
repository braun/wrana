
var ejs = require('ejs');
var i18n = require('i18next');
const { response } = require('express');

function renderFile(res,file,model,opts)
  {
    if(opts == null)
        opts = {};
    if(opts.mime)
        res.set('Content-Type', opts.mime);
    Object.assign(model,ejs.locals);
    ejs.renderFile(__dirname + file,model,null,
    function(err,str)
    {
      if(err)
      {
        console.error(err.message,err);
        ejs.renderFile(__dirname + "/webcommons/error.ejs",model,null,
          function(err,str)
          {
            res.status(500).send(str);
          });
      } else
      {
        str = res.i18n.services.interpolator.interpolate(str,{},res.language,{
          missingInterpolationHandler: (s,match)=>
          {
            const k = match[1];
            const r= res.i18n.t(k);
            return r;
          }
        })
        res.send(str)
      }
    });
  }

  function renderWithBase(req,res,file,model)
  {
      var baseUrl = req.headers['x-baseurl'];
      if(baseUrl == null)
        baseUrl = "/";
      console.log('base url: '+baseUrl);
      console.log('url:'+req.url);
      console.log('headers',JSON.stringify(req.headers,null,2));
      //   if(baseUrl != null)
      //      url = baseUrl+url;
      if(model == null)
        model = {}
  
      model.base = baseUrl;
      renderFile(res,file,model);
  }

  function extendWithBase(req,url)
  {
    var baseUrl = req.headers['x-baseurl'];
    console.log('headers',JSON.stringify(req.headers,null,2));
    console.log('url:'+req.url);
    console.log('base url: '+baseUrl);
    if(baseUrl != null)
        url = baseUrl+url;
    return url;
  }
  module.exports.renderFile = renderFile;
  module.exports.renderWithBase = renderWithBase;
  module.exports.extendWithBase = extendWithBase;