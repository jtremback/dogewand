'use strict';

var https = require('https');
var fs = require('fs');
var app = require('./app.js');

var options = {
  key: fs.readFileSync('./ssl/server.key'),
  cert: fs.readFileSync('./ssl/server.crt'),
};

// Start the app by listening on <port>
var port = process.env.PORT || 3700;
https.createServer(options, app).listen(port);
console.log('Express app started on port ' + port);