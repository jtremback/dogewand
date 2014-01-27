var config = require('../../config/config')();

module.exports =
'!function() {' +
  'var jsCode = document.createElement("script");' +
  'jsCode.setAttribute("src", "' + config.url + '/js/bookmarklet.js");' +
  'document.body.appendChild(jsCode);' +
'}();';