const http = require("http");
const path = require("path");
const express = require("express");
const socketIo = require("socket.io");
const cookieParser = require("cookie-parser");

// connect with database using mongoose
require("./db/mongoose");

// require the routers
const userRouter = require("./routes/user");

//require the middlewares
const wrap = require("./middleware/wrap");

const app = express();
const server = http.createServer(app);
const io = new socketIo.Server(server, { cookie: false });

//paths
const publicdirPath = path.join(__dirname, "../public");

app.use(express.static(publicdirPath));
app.use(express.urlencoded());
app.use(express.json());
app.use(cookieParser());

app.use(userRouter);

io.use(wrap);

io.on("connection", (socket) => {
    console.log("main");
});

server.listen("3000");
