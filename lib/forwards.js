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
 * @param  {net.Socket} from      from which Socket
 * @param  {Array|String} to      to which address
 * @param  {Number} reconnectTime
 * @constructor
 */
function Forwards(from, to, reconnectTime) {
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
  this.reconnectTime = parseInt(reconnectTime);
  if (isNaN(this.reconnectTime)) {
    this.reconnectTime = 5000;  //default 5000ms to reconnect
  }
  this.working = false;
  var self =  this;
  this.eventHandles = {
    data: function(data) {
      self.client && self.client.write(data);
    },
    end: function(data) {
      self.clent && self.client.end(data);
    },
    close: function() {
      self.stopForwards();
    }
  }
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
  this.client.on('error', function(err) {
    if (this.client && !this.client.writable) {
      this.client.end();
    }
  }.bind(this));

  this.client.on('close', function() {
    this.client = null;
    if (!this.working) {
      return;
    }
    //if reconnectTime <= 0, never reconnect
    if (this.reconnectTime > 0) {
      setTimeout(function() {
        this.initClient();
      }.bind(this),this.reconnectTime);
    }
  }.bind(this));
};

/**
 * bind events to server
 * @private
 */
Forwards.prototype.bindForwards = function() {
  var handles = this.eventHandles;
  for (var key in handles) {
    this.addServerListener(key, handles[key]);
  }
}

/**
 * default max listeners, from `events`
 * @type {Number}
 */
var defaultMaxListeners = 10;

/**
 * mock addListener from `events`
 * unshift listener to the head of events array
 * @param {String} type     
 * @param {Function} listener 
 */
Forwards.prototype.addServerListener = function(type, listener) {
  var socket = this.fromSocket;
  var _events = socket._events;
  if (!_events) {
    socket._events = _events = {};
  }
  if (!_events[type]) {
    _events[type] = listener;
  } else if (Array.isArray(_events[type])) {
    _events[type].unshift(listener);
  } else {
    _events[type] = [listener, _events[type]];
  }
  // Check for listener leak
  if (Array.isArray(_events[type]) && !_events[type].warned) {
    var m;
    if (socket._maxListeners !== undefined) {
      m = socket._maxListeners;
    } else {
      m = defaultMaxListeners;
    }
    if (m && m > 0 && socket._events[type].length > m) {
      socket._events[type].warned = true;
      console.error('(node) warning: possible EventEmitter memory ' +
                    'leak detected. %d listeners added. ' +
                    'Use emitter.setMaxListeners() to increase limit.',
                    socket._events[type].length);
      console.trace();
    }
  }
  return this;
}

exports.Forwards = Forwards;

/**
 * exports function connect
 * connect `from` to `to`, forwards all data 
 * @param  {Server,Socket} from    
 * @param  {Array,String} to      
 * @param  {Number} reconnectTime    when socket end, wait reconnectTime to reconnect, if <= 0, never reconnect
 */
exports.connect = function (from, to, reconnectTime) {
  if (from instanceof net.Server) {
    from.on('connection', function(socket) {
      new Forwards(socket, to, reconnectTime);
    });
  } else if (from instanceof net.Socket) {
    return new Forwards(from, to, reconnectTime);
  } else {
    throw new Error('First Argument must be instance of net.Socket or net.Server');
  }
}