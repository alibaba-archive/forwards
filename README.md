forwards ![traves-ci](https://secure.travis-ci.org/dead-horse/forwards.png)
========

Make server forwards all data to another. So you can send online traffic to develop host.

## Usage   
You can use the exports function `connect`

```js
var forwards = require('forwards');

/**
 * exports function connect
 * connect `from` to `to`, forwards all data 
 * @param  {Server,Socket} from    
 * @param  {Array,String} to      
 * @param {Object} options 
 *  - {Number} reconnectTime
 *  - {Number} delay       forwards delay. defalut forwards 10ms latter
 */
forwards.connect(from, to, reconnectTime);
```

 * Use `forwards` in `net`   

 ```js
var forwards = require('forwards');
var net = require('net');
var server = net.createServer();
server.listen(8080);
forwards.connect(server, 'localhost:8081');
 ```
or try this style   

```js
var forwards = require('forwards');
var net = require('net');
var server = net.createServer();
server.listen(8080);
server.on('connection', function(socket) {
  var f = forwards.connect(socket, 'localhost:8081');
});
```

 * Use `forwards` in `http`   

```js
var forwards = require('forwards');
var http = require('http');
server = http.createServer();
server.listen(8080);
forwards.connect(server, 'localhost:8081');
```
 * Also you can use `forwards` in `connect`, `express` and other every thing base on `net`   

## Install    
 * Clone from github   
 * Use `npm`   

 ```
 npm install forwards
 ```

 ## License   
 MIT
