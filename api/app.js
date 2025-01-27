var createError = require('http-errors');
var cors = require("cors");
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');
var standingsRouter = require('./routes/standings');
var playerRouter = require('./routes/player');
var teamRouter = require('./routes/team');
const { spawn } = require('child_process');

let corsOptions = {
  origin : ['http://localhost:3000'],
}

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(cors(corsOptions));
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/users', usersRouter);
app.use("/standings", standingsRouter);
app.use("/player", playerRouter);
app.use("/team", teamRouter);

app.use("/python-service/:message", (req,res) => {
  const {message} = req.params;
  const pythonProcess = spawn('python',['./routes/hockey-ai.py', message]);

  pythonProcess.stdout.on('data',(data)=>{
    res.send(data.toString());
  })
  pythonProcess.stderr.on('data',(data)=>{
    console.error('stderr: ' + data);
    res.status(500).send(data.toString());
  })
  pythonProcess.on('close', (code) =>{
    console.log('child process exited with code: ' + code);
  })
})

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
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
