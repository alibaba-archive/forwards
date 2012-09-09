var net = require('net');
var http = require('http');
var forwards = require('../');

var server = net.createServer();
server.listen(7871);
forwards.connect(server, 'localhost:7891');

server = http.createServer();
server.listen(7872);
server.on('connection', function(socket) {
  forwards.connect(socket, 'localhost:7892');
});
