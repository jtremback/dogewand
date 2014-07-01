'use strict';

var postgrator = require('postgrator');
var config = require('../config/config')();

postgrator.config.set({
  migrationDirectory: './',
  driver: 'pg',
  connectionString: config.db
});

postgrator.migrate(process.argv[2], function (err, migrations) {
  if (err) console.log(err);
  if (migrations) console.log(migrations);
  process.exit();
});