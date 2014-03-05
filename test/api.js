'use strict';

var test = require('tape');
var mongoose = require('mongoose');
var request = require('supertest');
var config = require('../config/config')('test');
var app = require('../app.js');
var passportStub = require('passport-stub-js');
var utility = require('../test-utility');


test('API controller', function (t) {
  var account;
  var username = 'Jehoon';
  var provider = 'farcebook';


  passportStub.install(app);
  var Account = mongoose.model('Account');

  t.test('setup', function (t) {

    account = new Account({
      'providers': [{
        'username': username,
        'provider': provider
      }]
    });
    
    utility.resetMongo(Account, function () {
      account.save(function (err, account) {
        console.log(err, account);
        t.notOk(err, 'account saves ok');
        t.end();
      });
    });
  });

  t.test('smoke test', function (t) {
    request(app)
      .get('/api')
      .expect(200)
      .end(function (err) {
        t.notOk(err, '/api returns 200');
        t.end();
      });
  });

  t.test('logged out', function (t) {
    request(app)
      .get('/api/user')
      .expect(401)
      .end(function (err) {
        t.notOk(err, 'logged out returns 401');
        t.end();
      });
  });

  t.test('logged in', function (t) {
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