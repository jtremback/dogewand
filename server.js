'use strict';

var https = require('https');
var http = require('http');
var fs = require('fs');
var app = require('./app.js');
var config = require('./config/config.js')();
var db = require('./app/models/db.js');


// Start the app by listening on <port>
var port = config.port;
// Load functions into postgres - wierd spot to put this, but it works
db.insertPgFunctions(function () {
  if (process.env.NODE_ENV === 'dev') {
    var options = { // Enables node ssl for dev., prod uses nginx ssl
      key: fs.readFileSync('./dev_ssl/server.key'),
      cert: fs.readFileSync('./dev_ssl/server.crt'),
    };
    https.createServer(options, app).listen(port);
  }
  else {
    http.createServer(app).listen(port);
  }
});

console.log('Express app started on port ' + port);