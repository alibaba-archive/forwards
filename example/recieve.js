var net = require('net');
var http = require('http');
var forwards = require('../');

var server = net.createServer(function(socket) {
  socket.on('data', function(data) {
    console.log(data);
  })
});
server.listen(7891);

server = http.createServer(function(req, res) {
  console.log(req.url);
});
server.listen(7892);