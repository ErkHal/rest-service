# rest-service

A small REST service prototype to be used with planned web/mobile
application.

Technologies used:

- Node.js
- Express.js
- MySQL

Author Erkki Halinen

##How to setup
You need to provide a dbConfig.json for the MySQL database connection.
It has to be in the root directory of the project.

Value names of dbConfig.json:
```
{
  "host": "HOSTNAME",
  "password": "PASSWORD",
  "database": "DATABASE"
}
```
Just create a dbConfig.json file in your favorite IDE/Text editor and add that to the root of the project.
