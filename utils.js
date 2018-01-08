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
