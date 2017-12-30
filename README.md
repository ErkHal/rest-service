# rest-service

A small REST service prototype to be used with planned web/mobile
application.

Technologies used:

- Node.js
- Express.js
- MySQL

Author Erkki Halinen

## How to setup

Please make sure that you these installed:
- Node.js (remember to update to latest version as well)
- MySQL server (same here)


You need to provide a restConfig.json for file uploads and the MySQL database connection.
It has to be in the root directory of the project.

Value names of restConfig.json:
```
{
  "host": "HOSTNAME",
  "user": "USERNAME",
  "password": "PASSWORD",
  "database": "DATABASE",
  "uploadDir": "YOUR/FILE/PATH"
}
```
Just create a restConfig.json file in your favorite IDE/Text editor and add that to the root of the project.

After that just navigate into the root directory of the project and type
```
node server.js
```
Into the console. That's it ! You now have the REST service up and running.
