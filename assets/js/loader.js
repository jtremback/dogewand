var config = require('../../config/config')();

exports.loader =
'javascript:!function() {' +
  'var jsCode = document.createElement("script");' +
  'jsCode.setAttribute("src", "' + config.url + '");' +
  'document.body.appendChild(jsCode);' +
'}();';
