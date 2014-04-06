'use strict';

(function () {
  function $ (selector, el) {
       if (!el) {el = document;}
       return el.querySelector(selector);
  }

  function $$ (selector, el) {
       if (!el) {el = document;}
       return Array.prototype.slice.call(el.querySelectorAll(selector));
  }

  var PROVIDER_ORIGIN = $('.js-provider').textContent;

  var toolbar = $('.js-toolbar');
  if (toolbar) return _toolbar(toolbar);

  function _toolbar (el) {
    $('.js-tip', el).addEventListener('click', function () {
      parent.postMessage('{ "method": "tip" }', PROVIDER_ORIGIN);
    }, false);

    $('.js-exit', el).addEventListener('click', function () {
      parent.postMessage('{ "method": "exit" }', PROVIDER_ORIGIN);
    }, false);

    parent.postMessage(JSON.stringify({
      method: 'size',
      data: {
        width: el.clientWidth,
        height: el.clientHeight
      }
    }), PROVIDER_ORIGIN);

  }

  var modal = $('.js-modal');
  if (modal) return _modal(modal);

  function _modal (el) {
    parent.postMessage(JSON.stringify({
      method: 'size',
      data: {
        width: '100%',
        height: '100%'
      }
    }), PROVIDER_ORIGIN);
  }
})();
