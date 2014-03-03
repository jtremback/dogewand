'use strict';

var test = require('tape');
var request = require('supertest');
var app = require('../server.js');

test('API controller', function (t) {
  t.test('foo', function () {
    request(app)
      .get('/api')
      .expect(200)
      .end(function (err) {
        console.log(err);
        t.notOk(err);
        t.end();
      });
  });
});