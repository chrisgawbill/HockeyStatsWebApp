var createError = require("http-errors");
var cors = require("cors");
var express = require("express");
var path = require("path");
var cookieParser = require("cookie-parser");
var logger = require("morgan");

var indexRouter = require("./routes/index");
var usersRouter = require("./routes/users");
var standingsRouter = require("./routes/standings");
var playerRouter = require("./routes/player");
var teamRouter = require("./routes/team");
var scheduleRouter = require("./routes/schedule");

const { spawn } = require("child_process");

let corsOptions = {
  origin: ["http://localhost:3000"],
};

var app = express();

// view engine setup
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "jade");

app.use(cors(corsOptions));
app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));

app.use("/", indexRouter);
app.use("/users", usersRouter);
app.use("/standings", standingsRouter);
app.use("/player", playerRouter);
app.use("/team", teamRouter);
app.use("/schedule", scheduleRouter);

app.post("/python-service", async (req, res) => {
  try{
    const message = req.body.content; 
    const result = await runAIPythonScript(message)
    res.send(result);
  }catch(error){
    console.error("Error running python script: ", error);
    res.status(500).send(`Internal Server Error: ${error}`);
  }
});
// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render("error");
});

const runAIPythonScript = (message) =>{
  return new Promise((resolve, reject) => {
    const pythonProcess = spawn("python", ["./routes/hockey-ai.py", message]);

    let stderrLogs = "";
    let stdoutData = "";

    pythonProcess.stdout.on("data", (data) => {
      stdoutData += data.toString();
    });
    pythonProcess.stderr.on("data", (data) => {
      stderrLogs += data.toString();
      console.error("stderr: " + data);
    });
    pythonProcess.on("close", (code) => {
      console.log("child process exited with code: " + code);
      if (code !== 0) {
        reject(`Process exited with code ${code}`);
      } else {
        try {
          const jsonReponse = JSON.parse(stdoutData);
          if (jsonReponse.error) {
            reject(jsonReponse.error);
          } else {
            resolve(jsonReponse.data);
          }
        } catch (e) {
          reject(`Error parsing JSON response\n${stdoutData}`);
        }
      }
    });
  });
}
module.exports = app;
