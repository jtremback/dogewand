'use strict';

var postgrator = require('postgrator');

postgrator.config.set({
  migrationDirectory: '.',
  driver: 'pg',
  connectionString: 'pg://jehan@localhost:5432/dogewand-test'
});

postgrator.migrate('001', function (err, migrations) {
  if (err) console.log(err);
  else console.log(migrations);
});