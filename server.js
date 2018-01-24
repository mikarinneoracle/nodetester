var express = require('express');
var bodyParser = require('body-parser');
var swaggerJSDoc = require('swagger-jsdoc');
var MongoClient = require('mongodb').MongoClient;

var port = process.env.PORT || process.env.npm_package_config_port;
var mongodb_host = process.env.BACKEND_MONGODB_HOST || null;
var useSessions = true; // Default is true
var loaderioKey = process.env.LOADERIO_KEY || null;

if(process.env.USE_SESSIONS)
{
    // To support app container user-defined values
    useSessions = process.env.USE_SESSIONS === 'true';
    console.log("USE_SESSIONS - Setting use sessions " + useSessions);
} else if(process.env.npm_package_config_use_sessions) {
    // To support Docker package.json user-defined values
    useSessions = process.env.npm_package_config_use_sessions === 'true';
    console.log("npm_package_config_use_sessions - Setting use sessions " + useSessions);
}
var app = express();
var session = require('express-session');
var i = 0; // When not using sessions

module.exports = app;

if(useSessions)
{
  app.use(session(
    { secret: 'mynodejssecretXYZ123',
      resave: false, saveUninitialized: true,
      cookie: { maxAge: 60000 }
    }
  ));
}

app.use(bodyParser.json());
app.use(express.static(__dirname));

app.get('/loaderio-*', function(req, res) {
    if(loaderioKey)
    {
        res.send(loaderioKey);
    } else {
        return res.status(404).json( { 'msg' : 'Loader.io key missing from config' });
    }
});

/**
 * @swagger
 * /env:
 *   get:
 *     tags:
 *       - Env
 *     description: Returns environment variables.
 *
 *     produces:
 *       - application/json
 *     responses:
 *       200:
 *         description: Returns environment variables.
 */

app.get('/env/', function(req, res) {
  res.send({ 'env' : process.env });
});

/**
 * @swagger
 * /inc:
 *   get:
 *     tags:
 *       - Inc
 *     description: <div>A very simple service.<br></div>
 *                  <div>Returns the increment of i by 1 in memory (or from database if configured and userid passed).</div>
 *                  <div>If environment's <b>useSessions=true</b>, returns the increment of i from user's session.</div>
 *                  <div>Userid is optional and when passed and database configured increments and returns i from database for the passed username.</div>
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: userid
 *         description: Users's id
 *         in: query
 *         required: false
 *         type: string
 *     responses:
 *       200:
 *         description: Returns the incremented value of i by 1. Also returns the boolean value of useSessions.
 *         schema:
 *           properties:
 *            i:
 *              type: integer
 *            useSessions:
 *              type: boolean
 */

app.get('/inc/', function(req, res) {
  var userid = req.query.userid; // Optional
  var result;
  if(userid && mongodb_host)
  {
    // Try locating session from db, create if not found
    MongoClient.connect('mongodb://' + mongodb_host + '/sessions', function(err, db) {
      if(err)
      {
        console.log(err);
        res.send({ 'i': -1 , 'err': err.message });
        return;
      } else {
        var collection = db.collection('sessions');
        collection.find({ userid : userid }).toArray(function(err, sessions) {
          if(err)
          {
              console.log(err);
              res.send({ 'i': -1 , 'err': err.message });
              return;
          } else
          {
            if(sessions && sessions.length == 1)
            {
                var userid_i = sessions[0].i;
                var _id = sessions[0]._id;
                userid_i++;
                // update
                console.log("Updating db session " + (userid ? userid : ''));
                var session = {'userid' : userid, 'i' :  userid_i};
                collection.update({ userid : userid }, session, function(err, r) {
                  if(err)
                  {
                      console.log(err);
                      res.send({ 'i': -1 , 'err': err.message });
                      return;
                  }
                  res.send({ 'i': userid_i , 'useSessions': useSessions, 'userid':userid });
                  db.close();
                  return;
                });
            } else {
                // insert
                console.log("Creating a new db session " + (userid ? userid : ''));
                var session = {'userid' : userid, 'i' :  0};
                collection.insert(session, function(err, r) {
                  if(err)
                  {
                      console.log(err);
                      res.send({ 'i': -1 , 'err': err.message });
                      return;
                  }
                  res.send({ 'i': 0 , 'useSessions': useSessions, 'userid':userid });
                  db.close();
                  return;
                });
            }
          }
        });
      }
    });
  } else if(useSessions) {
      var session = req.session;
      if (session.i != null)
      {
        session.i++;
      } else {
        console.log("A new session " + (userid ? userid : ''));
        session.i = 0;
      }
      req.session.save(); // Unless calling this the session is saved in the end of the req by default
      result = session.i;
      if(userid)
      {
        res.send({ 'i': result , 'useSessions': useSessions , 'userid' : userid });
      } else {
        res.send({ 'i': result , 'useSessions': useSessions });
      }
  } else {
    result = i++;
    res.send({ 'i': i , 'useSessions': useSessions });
  }
});


/**
 * @swagger
 * /last:
 *   get:
 *     tags:
 *       - Last
 *     description: <div>A very simple service. Same as inc but returns the last value from db instead.<br></div>
 *                  <div>Works only when database persistence configured.</div>
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: userid
 *         description: Users's id
 *         in: query
 *         required: true
 *         type: string
 *     responses:
 *       200:
 *         description: Returns the user's last value of i from db.
 *         schema:
 *           properties:
 *            i:
 *              type: integer
 *            useSessions:
 *              type: boolean
 *       404:
 *         description: User not found.
 *         schema:
 *           properties:
 *            msg:
 *              type: string
 */

app.get('/last/', function(req, res) {
  var userid = req.query.userid; // Optional
  var result;
  if(userid && mongodb_host)
  {
    MongoClient.connect('mongodb://' + mongodb_host + '/sessions', function(err, db) {
      if(err)
      {
        console.log(err);
        res.send({ 'i': -1 , 'err': err.message });
        return;
      } else {
        var collection = db.collection('sessions');
        collection.find({ userid : userid }).toArray(function(err, sessions) {
          if(err)
          {
              console.log(err);
              res.send({ 'i': -1 , 'err': err.message });
              return;
          } else
          {
            if(sessions && sessions.length == 1)
            {
                var userid_i = sessions[0].i;
                res.send({ 'i': userid_i , 'useSessions': useSessions, 'userid':userid });
                db.close();
                return;
            } else {
                // Not found
                db.close();
                return res.status(404).json( { 'msg' : userid + ' not found' });
            }
          }
        });
      }
    });
  } else {
    return res.status(500).json( { 'msg' : 'Need to have db configured and userid supplied in this service call.' });
  }
});

app.get('/exit', function(req, res) {
  process.exit();
});

app.listen(port, function() {
  	console.log('server listening on port ' + port);
    console.log("Using sessions is :" + useSessions);
});

// swagger definition
var swaggerDefinition = {
  info: {
    title: 'Node Swagger API',
    version: '1.0.0',
    description: 'Docker Node.js RESTful API with Swagger',
  },
  basePath: '/',
};

// options for the swagger docs
var options = {
  // import swaggerDefinitions
  swaggerDefinition: swaggerDefinition,
  // path to the API docs
  apis: ['./server.js'],
};

// initialize swagger-jsdoc
var swaggerSpec = swaggerJSDoc(options);

// serve swagger
app.get('/swagger.json', function(req, res) {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});
