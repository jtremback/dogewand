'use strict';

var https = require('https');
var fs = require('fs');
var app = require('./app.js');
var config = require('./config/config.js')();
var db = require('./app/models/db.js');

var options = {
  key: fs.readFileSync('./ssl/server.key'),
  cert: fs.readFileSync('./ssl/server.crt'),
};

// Start the app by listening on <port>
var port = config.port;
// Load functions into postgres
db.insertPgFunctions(function () {
  https.createServer(options, app).listen(port);
});

console.log('Express app started on port ' + port);