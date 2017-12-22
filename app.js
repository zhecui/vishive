var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');

var routes = require('./routes');
var users = require('./routes/users');
var http = require('http');

var app = express();

var hostname = 'localhost:3000';
var peerIds = [];



/* peer server to give unique id to each peer */
var PeerServer = require('peer').PeerServer;
var masterId = "";
var peerList = [];
// environment
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'html');
app.engine('.html', require('ejs').__express);
app.set('port', process.env.PORT || 3000);

app.use(express.static(path.join(__dirname, 'public')));



// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());


// simple transform example
app.get('/', routes.index);

// pca example
app.get('/pca', routes.pca);

// incremental database example
app.get('/ids', routes.ids);

// distributed DBSCAN example
app.get('/dbscan', routes.dbscan);

// wikipedia text analysis example
app.get('/wikipedia', routes.wikipedia);
// catch 404 and forward to error handler
// app.use(function(req, res, next) {
//   var err = new Error('Not Found');
//   err.status = 404;
//   next(err);
// });

app.get('/peerlist', function(req, res){
  var jsonList = {};
  jsonList.title = "list";
  jsonList.data = peerlist;
  console.log("hello");
  res.send("Hello");
});

// default pages 
// app.get('/', routes.index);



// error handlers

// development error handler
// will print stacktrace
// if (app.get('env') === 'development') {
//   app.use(function(err, req, res, next) {
//     res.status(err.status || 500);
//     res.render('error', {
//       message: err.message,
//       error: err
//     });
//   });
// }

// production error handler
// no stacktraces leaked to user
// app.use(function(err, req, res, next) {
//   res.status(err.status || 500);
//   res.render('error', {
//     message: err.message,
//     error: {}
//   });
// });

/* httpserver */
var httpserver = http.createServer(app);
httpserver.listen(app.get('port'), function () {
    console.log('Express server listening on port ' + app.get('port'));
});

var server = PeerServer({port: 8000, path: '/VisHive', allow_discovery: true, key: 'peerjs'});

server.on('connection', function(conn){
  if(masterId == "") {
    masterId = conn;
    console.log("master peer Id is ", masterId);
  }
  var idx = peerList.indexOf(conn); // only add id if it's not in the list yet
  if (idx === -1) {
    peerList.push(conn);
  }
});

server.on('disconnect', function(disconn){
  var idx = peerList.indexOf(disconn); // only attempt to remove id if it's in the list
  if (idx !== -1) {peerList.splice(disconn, 1);}
});





  
