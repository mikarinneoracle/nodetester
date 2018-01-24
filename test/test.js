var server = require('../server');
var assert = require('assert');
var request = require('supertest');

describe('Running basic unit tests', function() {

  it('GET /inc', function (done) {
    request(server)
        .get('/inc')
        //.auth(username, password)
        .expect(200)
        .end(function (err, res) {
          if (err) return done(err);
          done();
        });
  });
});
