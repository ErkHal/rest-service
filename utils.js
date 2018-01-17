/*
  utils.js

  Author ErkHal https://github.com/ErkHal

  Contains util functions for Node.js REST service prototype project

  https://github.com/ErkHal/rest-service
 */

const cookies = require('cookies');

module.exports = {

  isLegit : (request) => {

    const auth = request.cookies['authtoken'];

    if(auth === undefined) {
      return false;
      }
      return true;
    }
}

module.exports = {
  getAllImagesQuery : 'SELECT * FROM images',
  uploadQuery : "INSERT INTO images(TITLE, FILEPATH) VALUES (?, ?)",
  setTokenQuery : "UPDATE users SET token = ? WHERE email = ? ",
  loginQuery : "SELECT * FROM users AS u WHERE ? = u.email AND ? = u.password",
  getAllQuery : "SELECT * FROM users",
  insertQuery : "INSERT INTO users(EMAIL, PASSWORD) VALUES (?, ?)"
}
