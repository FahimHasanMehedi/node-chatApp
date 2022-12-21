const http = require("http");
const path = require("path");
const process = require("process");
const express = require("express");
const socketIo = require("socket.io");
const cookieParser = require("cookie-parser");

// connect with database using mongoose
require("./db/mongoose");

// require the routers
const userRouter = require("./routes/user");

//require the models
const User = require("./models/user");
const Chat = require("./models/chats");

//require the middlewares
const auth = require("./middleware/auth");
const expressAuth = require("./middleware/expressAuth");

//require the util functions
const getUsers = require("./utils/getUsers");

const app = express();
const server = http.createServer(app);
const io = new socketIo.Server(server, { cookie: false });

//paths
const publicDirPath = path.join(__dirname, "../public");

app.set("view engine", "hbs");

app.use(cookieParser());
app.use(express.static(publicDirPath));
app.use(express.urlencoded());
app.use(express.json());
app.use(userRouter);

io.use(auth);

io.on("connection", async (socket) => {
    socket.emit("user connected", socket.username);

    socket.on("fetch requests", async () => {
        getUsers(socket.username)
            .then(async (user) => {
                const requests = await user.getRequests();
                socket.emit("fetched requests", requests);
            })
            .catch((error) => {
                socket.emit("error");
            });
    });

    socket.on("add request", async ({ to }) => {
        getUsers(to).then(async (friend) => {
            await friend.addRequest(socket.userId);
            socket.broadcast.emit("added request", { to: friend.username });
        });
    });

    socket.on("add friend", async (friendUsername) => {
        getUsers(socket.username).then(async (me) => {
            await me.addFriend(friendUsername);
            await me.deleteRequest(friendUsername);
            socket.emit("deleted request");

            socket.broadcast.emit("added friend", {
                from: me.username,
                user: friendUsername,
            });
        });
    });

    socket.on("unfriend", async (username) => {
        Promise.all([getUsers(socket.username), getUsers(username)]).then(async (values) => {
            const me = values[0];
            const friend = values[1];

            me.friends = me.friends.filter((f) => !f.equals(friend._id));
            friend.friends = friend.friends.filter((f) => !f.equals(socket.userId));

            await me.save();
            await friend.save();

            io.emit("unfriended", {
                from: socket.username,
                to: username,
            });
        });
    });

    socket.on("delete request", async (username) => {
        getUsers(socket.username).then(async (user) => {
            await user.deleteRequest(username);
            socket.emit("deleted request");
        });
    });

    socket.on("get friends", async () => {
        getUsers(socket.username).then(async (me) => {
            const friends = await me.getFriends();
            socket.emit("fetched friends", friends);
        });
    });

    socket.on("join room", (room) => {
        socket.join(room);
    });

    socket.on("search people", async (username) => {
        const users = await User.find({ username: { $regex: username, $ne: socket.username, $options: "i" } });

        socket.emit("search results", users);
    });

    socket.on("fetch messages", async ({ to }) => {
        const roomname = [socket.username, to].sort().join("");
        socket.join(roomname);
        const chats = await Chat.find({ roomname }).sort({ _id: 1 });
        socket.emit("fetched messages", chats);
    });

    socket.on("delete chats", async (username) => {
        const roomname = [socket.username, username].sort().join("");
        await Chat.deleteMany({ roomname });

        Promise.all([getUsers(socket.username), getUsers(username)]).then(async (values) => {
            const me = values[0];
            const friend = values[1];
            me.inbox = me.inbox.filter((inb) => inb.friendUsername !== username);
            friend.inbox = friend.inbox.filter((inb) => inb.friendUsername !== socket.username);

            await me.save();
            await friend.save();

            io.emit("deleted chats", { from: socket.username, to: username });
        });

    });

    socket.on("fetch inbox messages", async () => {
        const me = await User.aggregate([
            {
                $match: {
                    _id: socket.userId,
                },
            },
            {
                $unwind: "$inbox",
            },
            {
                $sort: {
                    "inbox.messageId": -1,
                },
            },
            {
                $group: {
                    _id: "$_id",
                    inbox: { $push: "$inbox" },
                },
            },
        ]);

        if (me.length === 0) return socket.emit("fetched inbox messages", []);

        socket.emit("fetched inbox messages", me[0].inbox);
    });

    socket.on("fetch user profile", async (username) => {
        Promise.all([getUsers(socket.username), getUsers(username)]).then(async (values) => {
            const me = values[0];
            const friend = values[1];

            let isSent = false;
            let isReceived = false;
            let isFriend = false;
            if (friend.requests.includes(socket.userId)) isSent = true;
            if (friend.friends.includes(socket.userId)) isFriend = true;
            if (me.requests.includes(friend._id)) isReceived = true;

            socket.emit("show user modal", {
                username,
                isFriend,
                isReceived,
                isSent,
            });
        });
    });

    socket.on("fetch own profile", async () => {
        getUsers(socket.username).then(async (me) => {
            socket.emit("fetched own profile", { username: me.username, email: me.email });
        });
    });

    socket.on("private message", async ({ to, message }) => {
        const roomname = [socket.username, to].sort().join("");
        io.emit("join room", {
            to,
            roomname,
        });

        Promise.all([getUsers(socket.username), getUsers(to)]).then(async (values) => {
            const me = values[0];
            const friend = values[1];
            const chat = new Chat({
                message,
                sender: socket.username,
                receiver: to,
                roomname,
            });

            let exists = false;
            for (let i of me.inbox) {
                if (i.friendId.equals(friend._id)) {
                    i.lastMessage = message;
                    i.messageId = chat._id;
                    i.sender = socket.username;
                    exists = true;
                    break;
                }
            }

            if (exists) {
                for (let i of friend.inbox) {
                    if (i.friendId.equals(socket.userId)) {
                        i.lastMessage = message;
                        i.messageId = chat._id;
                        i.sender = socket.username;
                        exists = true;
                        break;
                    }
                }
            } else {
                me.inbox = me.inbox.concat({
                    friendUsername: to,
                    friendId: friend._id,
                    lastMessage: message,
                    messageId: chat._id,
                    sender: socket.username,
                });
                friend.inbox = friend.inbox.concat({
                    friendUsername: socket.username,
                    friendId: socket.userId,
                    lastMessage: message,
                    messageId: chat._id,
                    sender: socket.username,
                });
            }

            await friend.save();
            await me.save();
            await chat.save();
            io.to(roomname).emit("private message", chat);
        });
    });

    socket.on("logout", async () => {
        getUsers(socket.username).then(async (me) => {
            me.tokens = me.tokens.filter((token) => token.token !== socket.token);

            await me.save();

            socket.emit("logged out");
        });
    });
});

server.listen("3000");
