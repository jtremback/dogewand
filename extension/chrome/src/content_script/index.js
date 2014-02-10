'use strict';

var z = require('browserify-zepto');
require('./riot')(z); //Janky riot
var css = require('./style.styl');
var popup = require('./popup.wrap.html');


z.get('https://localhost:3700/floop', function(response){
  console.log(response);
  z('head').append('<style>' + css + '</style>');
  z('body').append(z.render(popup, { foo: (response ? response.username : 'not signed in') }));
});