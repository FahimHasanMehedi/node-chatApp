const jwt = require("jsonwebtoken");
const User = require("../models/user");

const auth = async (socket, next) => {
    try {
        let token;
        const cookies = socket.handshake.headers.cookie.split(" ");
        if (cookies.length > 1) {
        } else {
            token = cookies[0].replace("token=", "");
        }
        const decoded = await jwt.verify(token, "seethestonesetinyoureyes");
        const user = await User.findOne({ _id: decoded._id, "tokens.token": token });
        if (!user) throw new Error("Please authenticate");
        socket.token = token;
        socket.userId = user._id;
        socket.username = user.username;
        next();
    } catch (error) {
        next(error.message);
    }
};

module.exports = auth;
