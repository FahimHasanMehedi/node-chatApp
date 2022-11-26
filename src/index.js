const http = require("http");
const path = require("path");
const express = require("express");
const cookieParser = require("cookie-parser");

// connect with database using mongoose
require("./db/mongoose");

// require the routers
const userRouter = require("./routes/user");

const app = express();
const server = http.createServer(app);

//paths
const publicdirPath = path.join(__dirname, "../public");

app.use(express.static(publicdirPath));
app.use(express.urlencoded());
app.use(express.json());
app.use(cookieParser());
app.use(userRouter);

server.listen("3000");
