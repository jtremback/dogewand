'use strict';

var $ = require('browserify-zepto');
require('./riot')($); //Janky riot
var templates = require('./templates');


$.get('https://localhost:3700/floop', function(response){
  console.log(response);
  $('body').append($.render(templates.popup, { foo: response.username }));
});
