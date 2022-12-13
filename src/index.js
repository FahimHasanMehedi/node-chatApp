const http = require("http");
const path = require("path");
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

const app = express();
const server = http.createServer(app);
const io = new socketIo.Server(server, { cookie: false });

//paths
const publicdirPath = path.join(__dirname, "../public");

app.use(express.static(publicdirPath, { fallthrough: true }));
app.use(express.urlencoded());
app.use(express.json());
app.use(cookieParser());
app.use(userRouter);

io.use(auth);

io.on("connection", (socket) => {
    socket.emit("user connected", socket.username);

    socket.on("fetch requests", async () => {
        try {
            const user = await User.findOne({ _id: socket.userId });
            const requests = await user.getRequests();
            socket.emit("fetched requests", requests);
        } catch (error) {
            console.log(error);
        }
    });

    socket.on("add request", async ({ to }) => {
        const user = await User.findOne({ username: to });
        await user.addRequest(socket.userId);
        socket.broadcast.emit("added request", { to: user.username });
    });

    socket.on("add friend", async (friendUsername) => {
        const user = await User.findOne({ _id: socket.userId });
        await user.addFriend(friendUsername);
        await user.deleteRequest(friendUsername);
        socket.emit("deleted request");

        socket.broadcast.emit("added friend", {
            from: user.username,
            user: friendUsername,
        });
    });

    socket.on("unfriend", async (username) => {
        const me = await User.findOne({ _id: socket.userId }, { friends: 1 });
        const friend = await User.findOne({ username }, { _id: 1, friends: 1 });
        me.friends = me.friends.filter((f) => !f.equals(friend._id));
        friend.friends = friend.friends.filter((f) => !f.equals(socket.userId));

        await me.save();
        await friend.save();

        io.emit("unfriended", {
            from: socket.username,
            to: username,
        });
    });

    socket.on("delete request", async (username) => {
        const user = await User.findOne({ _id: socket.userId });
        await user.deleteRequest(username);
        socket.emit("deleted request");
    });

    socket.on("get friends", async () => {
        const user = await User.findOne({ _id: socket.userId });
        const friends = await user.getFriends();
        socket.emit("fetched friends", friends);
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
        const me = await User.findOne({ _id: socket.userId }, { inbox: 1 });
        const friend = await User.findOne({ username }, { inbox: 1 });

        me.inbox = me.inbox.filter((inb) => inb.friendUsername !== username);
        friend.inbox = friend.inbox.filter((inb) => inb.friendUsername !== socket.username);

        await me.save();
        await friend.save();

        io.emit("deleted chats", { from: socket.username, to: username });
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
        const friend = await User.findOne({ username }, { _id: 1, friends: 1, requests: 1 });
        const me = await User.findOne({ _id: socket.userId }, { requests: 1 });
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

    socket.on("private message", async ({ to, message }) => {
        const roomname = [socket.username, to].sort().join("");
        io.emit("join room", {
            to,
            roomname,
        });

        const friend = await User.findOne({ username: to }, { _id: 1, inbox: 1 });
        const me = await User.findOne({ _id: socket.userId }, { inbox: 1 });

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

        io.to(roomname).emit("private message", chat);
        await friend.save();
        await me.save();
        await chat.save();
    });
});

server.listen("3000");
