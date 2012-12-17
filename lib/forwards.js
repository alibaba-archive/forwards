/*!
 * forwards - lib/forwards
 * Copyright(c) 2012 dead-horse<dead_horse@qq.com>
 */

/**
 * Module dependencies.
 */
var net = require('net');

/**
 * forwards data to 
 * @param {net.Socket} from      from which Socket
 * @param {Array|String} to      to which address
 * @param {Object} options 
 *  - {Number} reconnectTime
 *  - {Number} delay       forwards delay. defalut forwards 10ms latter
 * @constructor
 */
function Forwards(from, to, options) {
  if (!(from instanceof net.Socket)) {
    throw new Error('Must from net.Socket');
  }
  if (typeof to === 'string') {
    var add = to.split(':');
    to = [add[1], add[0]];
  }
  //server and server handler
  this.fromSocket = from;

  //client
  this.to = to;
  this.client = null;
  options = options || {};
  this.reconnectTime = parseInt(options.reconnectTime);
  if (isNaN(this.reconnectTime)) {
    this.reconnectTime = 5000;  //default 5000ms to reconnect
  }
  this.delay = parseInt(options.delay);
  this.delay = isNaN(this.delay) ? 10 : this.delay;
  this.working = false;
  var self =  this;
  this.eventHandles = {
    data: function(data) {
      setTimeout(function () {
        self.client && self.client.writable && self.client.write(data);
      }, self.delay);
    },
    end: function(data) {
      setTimeout(function () {
        self.client && self.client.end(data);
      }, self.delay);
    },
    close: function() {
      setTimeout(function () {
        self.stopForwards();
      }, self.delay);
    }
  };
  this.startForwards();
}

/**
 * start forwards
 * @private
 */
Forwards.prototype.startForwards = function() {
  if (!this.working) {
    this.initClient();
    this.bindForwards();
    this.working = true;
  }
}

/**
 * stop forwards, remove all the events and close socekt to client
 * @private
 */
Forwards.prototype.stopForwards = function() {
  var handles = this.eventHandles || {};
  for (var key in handles) {
    this.fromSocket.removeListener(key, handles[key]);
  }
  this.working = false;
  this.client && this.client.end();
  this.client = null;
}

/**
 * create a socket to client,and bind events.
 * @private
 */
Forwards.prototype.initClient = function() {
  if (!this.client) {
    this.client = net.connect.apply(null, this.to);
  }
  var self = this;
  self.client.on('error', function(err) {
    setTimeout(function () {
      if (self.client && !self.client.writable) {
        self.client.end();
      }
    }, self.delay);
  });

  self.client.on('close', function() {
    setTimeout(function () {
      self.client = null;
      if (!self.working) {
        return;
      }
      //if reconnectTime <= 0, never reconnect
      if (self.reconnectTime > 0) {
        setTimeout(function() {
          self.initClient();
        },self.reconnectTime);
      }
    }, self.delay);
  });
};

/**
 * bind events to server
 * @private
 */
Forwards.prototype.bindForwards = function() {
  var handles = this.eventHandles;
  for (var key in handles) {
    this.fromSocket.on(key, handles[key]);
  }
}

exports.Forwards = Forwards;

/**
 * exports function connect
 * connect `from` to `to`, forwards all data 
 * @param  {Server,Socket} from    
 * @param  {Array,String} to      
 * @param {Object} options 
 *  - {Number} reconnectTime
 *  - {Number} delay       forwards delay. defalut forwards 10ms latter
 */
exports.connect = function (from, to, options) {
  if (from instanceof net.Server) {
    from.on('connection', function(socket) {
      new Forwards(socket, to, options);
    });
  } else if (from instanceof net.Socket) {
    return new Forwards(from, to, options);
  } else {
    throw new Error('First Argument must be instance of net.Socket or net.Server');
  }
}