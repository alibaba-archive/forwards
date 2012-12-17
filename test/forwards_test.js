/*!
 * forwards - test/forwards_test
 * Copyright(c) 2012 dead-horse<dead_horse@qq.com>
 */

/**
 * Module dependencies.
 */
var should = require('should');
var net = require('net');
var Forwards = require('../');

function pending(times, done){
  return function(){
    !(--times)&&done();
  }
}

var server;
var toServer;
var to = 'localhost:16565';
var port = 16566;
var forwards = [];
var clients = [];
var sockets = [];
describe("Forwards test", function() {
  before(function() {
    server = net.createServer();
    server.listen(port);
    toServer = net.createServer();
  });
  after(function() {
    server.close();
    //toServer.close();
  });

  describe('#common forwards', function() {
    before(function() {
      server.on('connection', function(socket) {
        forwards.push(Forwards.connect(socket, to, {reconnectTime: 100}));
      });
    });
    after(function() {
      server.removeAllListeners('connection');
    });

    it('should create forwards error', function() {
      try {
        Forwards.connect({}, to);
      } catch (err) {
        err.message.should.equal('First Argument must be instance of net.Socket or net.Server');
      }
      try {
        new Forwards.Forwards({}, to);
      } catch (err) {
        err.message.should.equal('Must from net.Socket');
      }
    });

    it('should forwards wrong server', function(done) {
      clients.push(net.connect(port, 'localhost'));
      setTimeout(function() {
        forwards[0].fromSocket._events.should.have.keys(['data', 'end', 'close']);
        setTimeout (function () {
          should.not.exist(forwards[0].client);
          done();   
        }, 10);
      }, 10);
    });

    it('should reconnect ok', function(done) {
      toServer.listen(16565);
      toServer.on('connection', function(socket) {
        sockets.push(socket);
      });
      setTimeout(function() {
        forwards[0].client.should.exist;
        forwards[0].client.writable.should.be.ok;
        forwards[0].client._events.should.have.keys(['close', 'error']);
        sockets.should.have.length(1);
        done();
      }, 100);
    });

    it('should forwards data ok', function(done) {
      done = pending(2, done);
      sockets[0].once('data', function(data) {
        data.toString().should.equal('test data');
        done();
      });
      forwards[0].fromSocket.once('data', function(data) {
        data.toString().should.equal('test data');
        done();
      });
      clients[0].write(new Buffer('test data'));
    });

    it('should forwards second data ok', function(done) {
      clients.push(net.connect(port, 'localhost'));
      setTimeout(function() {
        done = pending(2, done);
        sockets[1].once('data', function(data) {
          data.toString().should.equal('test data');
          done();
        });
        forwards[1].fromSocket.once('data', function(data) {
          data.toString().should.equal('test data');
          done();
        });
        clients[1].write(new Buffer('test data'));
      }, 10);
    });

    it('should reconnect when forwards conenct end', function(done) {
      forwards[1].client.end();
      setTimeout(function() {
        should.not.exist(forwards[1].client);
      }, 20);
      setTimeout(function() {
        (forwards[1].client instanceof net.Socket).should.be.ok;
        sockets[2].once('data', function(data) {
          data.toString().should.equal('another test');
          done();
        });
        clients[1].write(new Buffer('another test'));
      }, 120);
    }); 

    it('should forwards end ok', function(done) {
      done = pending(7, done);
      sockets[0].once('data', function(data) {
        data.toString().should.equal('end');
        done();
      });
      sockets[0].once('end', function() {
        done();
      });
      sockets[0].once('close', function() {
        done();
      });
      forwards[0].fromSocket.once('close', function() {
        done();
      });
      forwards[0].fromSocket.once('data', function(data) {
        data.toString().should.equal('end');
        done();
      });
      forwards[0].fromSocket.once('end', function() {
        done();
      });
      clients[0].end(new Buffer('end'));
      setTimeout(function() {
        should.not.exist(forwards[0].client);
        forwards[0].fromSocket.writable.should.not.be.ok;
        JSON.stringify(forwards[0].fromSocket._events).should.equal('{}');
        done();
      }, 20);
    });   
  });

  describe('connect net.Server ok', function() {
    it('should connect ok', function(done) {
      done = pending(3, done);
      toServer.once('connection', function(s) {
        s.once('data', function(data) {
          data.toString().should.equal('end');
          done();
        });
        s.once('end', function() {
          done();
        });
        s.once('close', function() {
          done();
        });
      });
      Forwards.connect(server, to);
      var client = net.connect(port, 'localhost');
      client.end(new Buffer('end'));
    }); 
  });
  describe('#add listenner test', function() {
    it('should put event handles', function(done) {
      server.removeAllListeners('connection');
      server.once('connection', function(socket) {
        socket.on('data', function(data) {
         
        });
        var fwd = Forwards.connect(socket, to);
        fwd.fromSocket._events.data.should.have.length(2);
        fwd.fromSocket._events.data[1].should.equal(fwd.eventHandles.data);
        socket.end();
        done();
      });
      net.connect(port, 'localhost');
    });
  });
});