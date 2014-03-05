'use strict';

var test = require('tape');
var mongoose = require('mongoose');
var request = require('supertest');
var config = require('../config/config')('test');
var app = require('../app');
var passportStub = require('passport-stub-js');


test('API controller', function (t) {
  var account;
  var username = 'Jehoon';
  var provider = 'farcebook';

  passportStub.install(app);
  var Account = mongoose.model('Account');

  t.test('setup', function () {

    account = new Account({
      'providers': [{
        'username': username,
        'provider': provider
      }]
    });

    account.save(function (err, account) {
      console.log(err, account);
      t.notOk(err, 'account saves ok');
      t.end();
    });
  });

  t.test('smoke test', function () {
    request(app)
      .get('/api')
      .expect(200)
      .end(function (err, res) {
        t.notOk(err, '/api returns 200');
        t.end();
      });
  });

  t.test('logged out', function () {
    request(app)
      .get('/api/user')
      .expect(401)
      .end(function (err, res) {
        t.notOk(err, 'logged out returns 401');
        t.end();
      });
  });

  t.test('logged in', function () {
    passportStub.login(account);
    request(app)
      .get('/api/user')
      .expect(200)
      .end(function (err, res) {
        var site = res.body.providers[0];
        t.equal(site.username, username, 'logged in username correct');
        t.equal(site.provider, provider, 'logged in provider correct');
        t.end();
      });
  });

  t.test('end', function (t) {
    mongoose.disconnect(function () {
      t.end();
    });
  });
});