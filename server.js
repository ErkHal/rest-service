/*
  server.js

  Author ErkHal https://github.com/ErkHal

  Main server file for Node.js REST prototype project

  https://github.com/ErkHal/rest-service
 */

// BASE SETUP
// =============================================================================

// call the packages we need
const express    = require('express');        // call express
const app        = express();                 // define our app using express
const bodyParser = require('body-parser');
const fetch = require('node-fetch');
const mysql = require('mysql');
const sha512 = require('sha512');
const cookies = require('cookies');
const cookieParser = require('cookie-parser');
const fs = require('fs');
const formidable = require('formidable');
const shortid = require('shortid');
const utils = require('./utils.js');
const url = require('url');

// configure app to use bodyParser()
// this will let us get the data from a POST
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(cookieParser());

const port = process.env.PORT || 8080;        // set our port

/*
Configure MySQL Database connection.
 */
const restConfFile = fs.readFileSync('restConfig.json');
const restConf = JSON.parse(restConfFile);

  const dbConnection = mysql.createConnection({
     host: restConf.host,
     user: restConf.user,
     password: restConf.password,
     database: restConf.database
   });

//Configure the upload directory to be able to serve static content
   app.use(express.static(restConf.uploadDir));

//Connect to database
   dbConnection.connect((err) => {
     if (err) {
       console.log(err);
     } else {
     console.log("Connected to database!");
   }
   });

// ROUTES FOR OUR API
// =============================================================================
const router = express.Router();              // get an instance of the express Router

router.use((req, res, next) => {
    console.log('Request from ' + req.ip);
    next(); // make sure we go to the next routes and don't stop here
});


// test route to make sure everything is working (accessed at GET http://localhost:8080/api)
router.get('/',(req, res) => {
    res.end('<h1> This is the root for Node.js REST service prototype</h1>'
    + '<h3>Author Erkki Halinen</h3>');
});

// more routes for our API will happen here

//############################################################################
//CREATE new User
router.route('/users')

.post((req, res) => {

  const email = req.body.email;
  const passwd = sha512(req.body.password).toString('hex');

//=========================================================================
//Query for creating a new entry in users table
  dbConnection.query(utils.insertQuery, [email, passwd], (err, result) => {
    if(err) {
      console.log("Duplicate registering attempt on " + email);
      console.log(err.sqlMessage);
      res.writeHead(500);
      res.end();
    } else {
      console.log("InsertQuery ran !");
      res.json({ message: "User inserted !",
                queryResult: result});
    }
  });
})

//############################################################################
// Get all users
// Users need to be logged in to access this endpoint
.get((req, res) => {

  if(utils.isLegit(req)) {

  dbConnection.query(utils.getAllQuery, (err, result) => {

    if(err) {
      console.log("Something fucked up at GET");
      console.log(err);
      res.send(err);
      return;

    }

      res.json(result);
    });

  } else {

    res.writeHead(403);
    res.end();
  }
});

//###########################################################################
//LOGIN user
router.route('/login')

.post((req, res) => {

  const email = req.body.email;
  const passwd = sha512(req.body.password).toString('hex');

 //===========================================================================
 //Login query that checks the login credentials from the users table

/*If query returns an entry, update that entry with the token and send token as
 cookie to client */
  dbConnection.query(utils.loginQuery, [email, passwd] , (err, result) => {
    if(err) {
      console.log("Something fucked up at LOGIN POST");
      console.log(err.sqlMessage);
      res.send({message: 'Error. Please try again'});
    } else {
      if(!result.length > 0) {
        console.log('Didnt find any user !');
        res.end('Couldnt find account matching these credentials.');
      } else {
        console.log('Found user !');

        /*Creates the token that is used to authenticate the user through
        cookies */
        const token = sha512(email + passwd + Math.random()).toString('hex');
        //===================================================================
        //Query for setting the token into database entry

        dbConnection.query(utils.setTokenQuery, [token, email] , (err, result) => {
          if(err) {
            console.log('Token entry got fucked up. Pls fix');
            console.log(err);
            res.writeHead(500);
            res.end();
          } else {

            res.cookie('authtoken', token, {maxAge: 90000, httpOnly: true});
            console.log("Response and cookie sent to user " + email);
            res.end();
          }
        });
      }
    }
  });
});

/*############################################################################
  LOGOUT service (Deletes the cookie from the client)*/
router.route('/logout')

.delete((req, res) => {
  res.clearCookie('authtoken');
  res.end();
  console.log("Cleared cookies !");
});

/*############################################################################
  UPLOAD service */

router.route('/upload')

.post((req, res) => {

  if(!utils.isLegit(req)) {
    res.writeHead(403);
    res.end();
    return;
  }

  const form = new formidable.IncomingForm();

  form.parse(req,(err, fields, files) => {

    try {

    form.multiples = false;
    form.keepExtensions = true;

    console.log("Uploading file " + files.image.name);

    const fileType = files.image.type.split('/').pop();

    const oldpath = files.image.path;
    const newpath = restConf.uploadDir + shortid.generate() + '.' + fileType;

//If the title is empty, dont upload the file.
    if(fields.title === undefined) {
      res.writeHead(403);
      res.end();
    } else {

      fs.rename(oldpath, newpath,(err) => {
         if (err) {
           console.log("Couldn't move the file to the right directory");
           console.log(err);
           res.send(403);
           res.end();
         } else {
         console.log('Uploaded ' + files.image.name);
         /* Query for inserting the entry about the uploaded image */

            dbConnection.query(utils.uploadQuery,
                                 [fields.title, newpath],
                                 (err, result) => {

              if(err) {

                res.writeHead(403);
                res.end();

              } else {
                console.log('Image entry inserted');
                res.writeHead(200);
                res.write('Image uploaded !');
                res.end();
                  }
                });
              }
            });
          }
        } catch(e) {
          console.log("Couldn't upload the file");
          console.log(e);
          res.write(403);
          res.end();
        }
      });
});

/*############################################################################
    Get all pictures */

router.route('/images')

.get((req, res) => {

    if(!utils.isLegit(req)) {
      res.writeHead(403);
      res.end();
      return;
    }

  dbConnection.query(utils.getAllImagesQuery, (err, result) => {

    if(err) {
     console.log('ERROR at image retrieval' + err);
   } else {
     res.header('Access-Control-Allow-Origin', '*');
     res.header('Access-Control-Allow-Methods', 'GET');
     res.header('Access-Control-Allow-Headers', 'Content-Type');
     res.json(result);
      }
    });
});

/*############################################################################
  Get single image with id
*/

router.route('/images/:id')

.get((req, res) => {

  const parsedUrl = url.parse(req.url, true);
  console.log(parsedUrl.id);

});


/*#############################################################################
--REGISTER OUR ROUTES -------------------------------
  all of our routes will be prefixed with /api */
app.use('/api', router);

// START THE SERVER
// =============================================================================
app.listen(port);
console.log('Server listening on port ' + port);
