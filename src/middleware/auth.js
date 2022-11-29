const User = require("../models/user");
const jwt = require("jsonwebtoken");

const auth = async (req, res, next) => {
    let token;

    if (req.handshake) {
        const cookies = req.handshake.headers.cookie.split(" ");
        if (cookies.length > 1) {
        } else {
            token = cookies[0].replace("token=", "");
        }
    } else {
        token = req.cookies.token;
    }

    const decoded = jwt.verify(token, "seethestonesetinyoureyes");
    const user = await User.findOne({ _id: decoded._id, token });
    req.token = token;
    req.user = user;
    next();
};

module.exports = auth;
