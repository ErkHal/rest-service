/*
  utils.js

  Author ErkHal https://github.com/ErkHal

  Contains util functions for Node.js REST service prototype project

  https://github.com/ErkHal/rest-service
 */

module.exports = {
  getAllImagesQuery : 'SELECT * FROM images',
  uploadQuery : "INSERT INTO images(TITLE, FILEPATH) VALUES (?, ?)",
  setTokenQuery : "UPDATE users SET token = ? WHERE email = ? ",
  loginQuery : "SELECT * FROM users AS u WHERE ? = u.email AND ? = u.password",
  getAllUsersQuery : "SELECT USERID, EMAIL, TOKEN FROM users",
  insertQuery : "INSERT INTO users(EMAIL, PASSWORD) VALUES (?, ?)",
  getSingleImageQuery: "SELECT * FROM images AS img WHERE ? = img.PICID",

  /*
  * THIS FUNCTION IS STILL IN THE MAKING, THIS IS JUST A DUMMY VERIFICATION
  */
  isAuthorized : (request) => {

    const auth = request.headers['x-access-token'];

    if(auth === undefined) {
      return false;
      }
      return true;
  }
}
