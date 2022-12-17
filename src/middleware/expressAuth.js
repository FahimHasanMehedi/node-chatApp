const jwt = require("jsonwebtoken");
const User = require("../models/user");

const auth = async (req, res, next) => {
    try {
        const token = req.cookies.token;
        const decoded = jwt.verify(token, "seethestonesetinyoureyes");

        const user = await User.findOne({ _id: decoded._id, "tokens.token": token });

        if (!user) throw new Error();

        req.token = token;
        req.username = user.username;
        if (req.url === "/chat") return next();

        res.redirect("/chat");
    } catch (error) {
        if (req.url === "/chat") return res.redirect("/");

        next();
    }
};

module.exports = auth;
