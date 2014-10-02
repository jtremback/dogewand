'use strict';

var https = require('https');
var http = require('http');
var fs = require('fs');
var app = require('./app.js');
var config = require('./config/config.js');
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

// serve static content from the /www dir at /static
app.use('/static/', express.static(path.join(__dirname, 'static')));

var daemon = require('./app/models/block_io-daemon.js')(6, 20000);

daemon.on('deposit', log);
daemon.on('error', log);

function log (stuff) {
  console.log('deposit daemon: ', stuff);
}

console.log('Express app started on port ' + port);