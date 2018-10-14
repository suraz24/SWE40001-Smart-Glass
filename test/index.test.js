var IndexPage = require('../src/WebRTC/index.js');

var io = require('socket.io-client')
, assert = require('assert')
, expect = require('expect.js');

describe('Suite of unit tests', function() {

    describe('First (hopefully useful) test', function() {

        var socket = io.connect('http://localhost:5000');
        socket.on('connect', function(done) {
            console.log('worked...');
            done();
        });

        it('Doing some things with indexOf()', function() {
            expect([1, 2, 3].indexOf(5)).to.be.equal(-1);
            expect([1, 2, 3].indexOf(0)).to.be.equal(-1);
        });

    });
});