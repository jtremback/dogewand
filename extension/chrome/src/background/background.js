'use strict';

/*global chrome*/

chrome.browserAction.onClicked.addListener(function() {

  chrome.tabs.executeScript({
    code: str `
     
      alert('foohammer');

      var req = new XMLHttpRequest();
      req.open('GET', 'https://localhost:3700/floop', true);
      req.send(null);

      `
  });
});
