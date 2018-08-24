var express = require('express');
var cors = require('cors');
var path = require('path');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var compression = require('compression');
var helmet = require('helmet'); //security

//var restController = require('./routes/restController'); //MySql
var restControllerPG = require('./routes/restControllerPG'); //PostGres SQL

var app = express();

app.use(cors()); //CORS handling

app.use(helmet()); //security
app.use(compression()); //Compress all routes

app.use(function(req, res, next) {
  // IE9 doesn't set headers for cross-domain ajax requests
  if(typeof(req.headers['content-type']) === 'undefined'){
      req.headers['content-type'] = "application/json; charset=UTF-8";
  }
  next();
});

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.use(logger('dev'));

app.use(cookieParser());

app.use(express.static(path.join(__dirname, 'public')));

app.options('*', cors()); // include before other routes

//app.use('/', restController); //solo per le richieste ajax e MySQL
app.use('/', restControllerPG); //solo per le richieste ajax e PortGress Sql

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
