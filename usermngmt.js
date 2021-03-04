const { authenticate } = require('passport');
const { renderFile } = require('./ejsrenderer');

// export initialization func
module.exports = async function(app)
{
  var database = app.database;
  const LocalStrategy = require('passport-local').Strategy;
  const passport = require('passport');
  var Users = require('./db/users')
  var connectEnsureLogin = require('connect-ensure-login');
  var checkLoginMiddleware =  
    connectEnsureLogin.ensureLoggedIn("user/login");
  var helper = require('./helper');

  /*
  * User agenda, store users, authentication mechanisms
  */

  //user store
  var users =  new Users(app.database.database);
  app.database.users = users
  app.database.collections['users'] = users;
  await users.init();
  
 
  // hash password of user
  function hashPassword(clearPwd,salt)
  {
    var crypto = require('crypto')
    if(salt == null)
      salt = crypto.randomBytes(8).toString('hex');
    
    var shasum = crypto.createHash('sha256')
    shasum.update(clearPwd+salt);
    var digest = shasum.digest('hex') 
    return { digest: digest, salt: salt };
  }
  // Configure the local strategy for use by Passport.
  //
  // The local strategy require a `verify` function which receives the credentials
  // (`username` and `password`) submitted by the user.  The function must verify
  // that the password is correct and then invoke `cb` with a user object, which
  // will be set at `req.user` in route handlers after authentication.
  passport.use(new LocalStrategy(
      function(username, password, cb) {
        database.users.findById(username).then( (user)=>{
          if (!user) 
            return cb(null, false,{ message:'Login failed'});
            
          if(!user.password) 
              return cb(null, false,{ message:'No password'});
          
          var digest = hashPassword(password,user.password.salt);
          if (user.password.digest != digest.digest) 
              return cb(null, false,{ message:'Login failed'}); 
            
          return cb(null, user);
        });
      }));
    
    
    // Configure Passport authenticated session persistence.
    //
    // In order to restore authentication state across HTTP requests, Passport needs
    // to serialize users into and deserialize users out of the session.  The
    // typical implementation of this is as simple as supplying the user ID when
    // serializing, and querying the user record by ID from the database when
    // deserializing.
    passport.serializeUser(function(user, cb) {
      cb(null, user._id);
    });
    
    passport.deserializeUser(function(id, cb) {
      database.users.findById(id).then(function (user) {
        if (user == null) { return cb(null,null); }
        cb(null, user);
      });
    });


  app.use(passport.initialize());
  app.use(passport.session());

  /*
  * User management GUI (create/login/logout/edit) 
  */

  // login page
  app.get('/user/login',function(req,res,next)
  {
    var e = req.flash('error');
    renderFile(res,'/webcommons/login.ejs',{ 'message':e });
    
  });
 
  
  
  // process login request
 // app.post('/user/login',authenticate);
 app.post('/user/login',
 passport.authenticate('local', { failureRedirect: 'login',failureFlash:true }),
 function(req, res) {
   res.redirect('..');
 }
);
  // logout page
  app.get('/user/logout',function(req,res,next)
  {
    var e = req.flash('error');
    renderFile(res,'/webcommons/logout.ejs',{ 'message':e });
    
  });

  // do logout me
  app.post('/user/logout',(req,res,next)=>
  {
    var really = req.body.really;
    if(really == "YES" && req.logout)
        req.logout();
        
    res.redirect('/');
  });

  // create new user gui
  app.get('/user/create',function(req,res,next)
  {
    var e = req.flash('error');
    renderFile(res,'/webcommons/createUser.ejs',
    { 'message':e,username:"",fullname:'',email:'' });
    
  });

  // create new user (capcha!)
  app.post('/user/create',async (req,res,next)=>
  {
    var username = req.body.username;
    var pwd1 = req.body.password;
    var pwd2 = req.body.passwordAgain;
    var fullname = req.body.fullname;
    var email = req.body.email;
    var e = null;
    var exists = await database.users.exists(username);
    if(exists)
    {
      e = "User exists";
      renderCreateUser();
      return;
    }
    if(pwd1 != pwd2)
    {
      e = "Passwords not matching";
      renderCreateUser();
      return;
    }
    var password = hashPassword(pwd1);
    await database.users.save( { _id: username, username: username, password: password, displayName: fullname, email :email   });
    next();
    function renderCreateUser()
    {
      renderFile(res,'/webcommons/createUser.ejs',{ 'message':e,username:username,fullname:fullname,email:email });
    }
  },  passport.authenticate);
  // get user edit page
  app.get('/user/profile',
  checkLoginMiddleware,
  async function(req,res,next)
  {
    var e = req.flash('error');
    var user = req.user;
    if(user == null)
    {
      res.status(500).send("Usr not found");
      return;
    }
    renderFile(res,'/webcommons/userProfile.ejs',
    { confirmation:null,'message':e,username:user.username,fullname:user.displayName,email:user.email });
    
  });

  // user editing
  app.post('/user/profile',
    checkLoginMiddleware,
    async (req,res,next)=>
  {
    var username = req.user.username;
    var pwd =  req.body.password;
    var pwd1 = req.body.passwordNew;
    var pwd2 = req.body.passwordAgain;
    var fullname = req.body.fullname;
    var email = req.user.email;
    var e = null;
    var c = null;

    var uo = Object.assign({},req.user);

    // edit fullname
    if(fullname == null || fullname == "")
    {
      e = "Full name must not be empty";
      renderUserProfile();
      return;
    }
    uo.displayName = fullname;

    //edit password
    if((pwd1 != null || pwd1 != ""))
    {
      var pwdhash = hashPassword(pwd,req.user.password.salt);
      if(req.user.password.digest != pwdhash.digest)
      {
        e = "Bad current password";
        renderUserProfile();
        return;
      }
      if(pwd1 != pwd2){
        e = "Passwords not matching";
        renderUserProfile();
        return;
      }
      else
      {
      c = "Password changed";
      uo.password = hashPassword(pwd1);
      }
    }
  
  //save edited user
    await database.users.save( uo);
    //renderUserProfile();
    req.body = {}
    req.body.username = username;
    req.body.password = pwd1;
    next();
    function renderUserProfile()
    {
      renderFile(res,'/webcommons/userProfile.ejs',{ 'message':e,username:username,fullname:fullname,email:email,confirmation:c});
    }
  },  passport.authenticate);


  // protect mountpoints for html pages
  function checkLoginGui()
  {
    var el = checkLoginMiddleware;
    return function(req,res,next)
    {
      var url = req.url.replace('//','/');
      if(url.startsWith("/webcommons") 
      || url.startsWith("/images")
      || url.startsWith("/api")
      || url.startsWith("/user")
      || url.startsWith("/styles"))
        next();
      else
      el(req,res,next);
    } 
  }

  // protect api mountpoints
  function checkLoginApi() {
    
    return function(req, res, next) {
      if (!req.isAuthenticated || !req.isAuthenticated()) {
      
        res.status(401).send("Not logged in");
      } else
      next();
    }
  }

  //protect mountpoints
  app.use('/',checkLoginGui());
  app.use('/api',checkLoginApi());

  //stdapi current user info
  app.get("/api/userinfo", async (req, res) => {
    var user = Object.assign({}, req.user);
    delete user.password;
    res.send(JSON.stringify(user, null, 2));
  })
  app.get("/api/profile.js", async (req, res) => {
    var user = Object.assign({}, req.user);
    delete user.password;
    var manifest = helper.readStringSync('../app/manifest.json');
    renderFile(res,'/webcommons/profile.ejs', {user:user,manifest:manifest},{mime:'text/javascript'});
  })
  

}