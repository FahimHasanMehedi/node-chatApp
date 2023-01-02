const jwt = require("jsonwebtoken");
const User = require("../models/user");
const getUsersByToken = require("../utils/getUsersByToken");

const auth = async (socket, next) => {
    try {
        const cookies = socket.handshake.headers.cookie.split(" ");
        const token = cookies[0].replace(/token=|;/g, "");
        const tokenExpiry = cookies[1].replace(/tokenExpiry=|;/g, "");
        const decoded = await jwt.verify(token, process.env.JWT_SECRET);
        getUsersByToken(decoded._id, token)
            .then((user) => {
                if (!user) throw new Error("Please authenticate");

                if (tokenExpiry < Date.now()) {
                    user.deleteTokens(token);
                    throw new Error("Please authenticate");
                }
                socket.token = token;
                socket.userId = user._id;
                socket.username = user.username;
                next();
            })
            .catch((error) => next(error.message));
    } catch (error) {
        next(error.message);
    }
};

module.exports = auth;
