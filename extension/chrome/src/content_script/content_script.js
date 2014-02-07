'use strict';

var $ = require('browserify-zepto');
var riot = require('./riot');
var templates = require('./templates');
console.log(riot);
$('body').append(riot.render(templates.popup, {foo: 'bar'}));
$.get('https://localhost:3700/floop', function(response){
  console.log(response);
});
