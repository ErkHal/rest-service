// server.js

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
    // do logging
    console.log('Got a new request !');
    next(); // make sure we go to the next routes and don't stop here
});


// test route to make sure everything is working (accessed at GET http://localhost:8080/api)
router.get('/',(req, res) => {
    res.end('<h1> This is the root for node.js REST service prototype</h1>'
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
  const insertQuery = "INSERT INTO users(EMAIL, PASSWORD)" +
  " VALUES (?, ?)";
//=========================================================================
  dbConnection.query(insertQuery, [email, passwd], (err, result) => {
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

  const auth = req.cookies['authtoken'];
  console.log("Trying to access /users GET endpoint");
  if(auth === undefined) {
    console.log('Unauthorized attempt at GET users');
    res.writeHead(403);
    res.end();

  } else {

  const getAllQuery = "SELECT * FROM users";

  dbConnection.query(getAllQuery, (err, result) => {
    if(err) {
      console.log("Something fucked up at GET");
      console.log(err);
      res.send(err);

    } else {
      res.json(result);
      }
    });
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
  const loginQuery = "SELECT * FROM users AS u WHERE "
   + " ? = u.email AND ? = u.password";
//===========================================================================

/*If query returns an entry, update that entry with the token and send token as
 cookie to client */
  dbConnection.query(loginQuery, [email, passwd] , (err, result) => {
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
        const setTokenQuery = "UPDATE users SET token = ? WHERE" +
        " email = ? "
        //===================================================================

        //Adding token to database entry
        dbConnection.query(setTokenQuery, [token, email] , (err, result) => {
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

  const auth = req.cookies['authtoken'];
  console.log("Trying to access /upload POST endpoint");
  if(auth === undefined) {
    console.log('Unauthorized attempt at POST upload');
    res.writeHead(403);
    res.end();

  } else {

  console.log('Upload service in action !');

  const form = new formidable.IncomingForm();

  form.parse(req,(err, fields, files) => {

    try {

    form.multiples = false;
    form.keepExtensions = true;

    console.log("Uploading file " + files.image.name);

    const oldpath = files.image.path;
    const newpath = restConf.uploadDir + shortid.generate();

    console.log(fields.title);

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
            const uploadQuery = "INSERT INTO images(TITLE, FILEPATH)" +
              " VALUES (?, ?)";

            dbConnection.query(uploadQuery, [fields.title, newpath], (err, result) => {

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
    }
});

/*#############################################################################
--REGISTER OUR ROUTES -------------------------------
  all of our routes will be prefixed with /api */
app.use('/api', router);

// START THE SERVER
// =============================================================================
app.listen(port);
console.log('Server listening on port ' + port);
