'use strict';

/*global chrome*/

chrome.browserAction.onClicked.addListener(function() {

  chrome.tabs.executeScript({
    code: str `
     
      alert("foohammer");

      `
  });
});
