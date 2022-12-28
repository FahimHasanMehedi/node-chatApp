const jwt = require("jsonwebtoken");
const User = require("../models/user");
const getUsersByToken = require("../utils/getUsersByToken");

const auth = async (req, res, next) => {
    const { token, tokenExpiry } = req.cookies;

    const decoded = await jwt.verify(token, process.env.JWT_SECRET);

    getUsersByToken(decoded._id, token)
        .then((user) => {
            if (!user) {
                throw new Error("Please Authenticate");
            }

            if (tokenExpiry < Date.now()) {
                user.deleteTokens(token);
                return res.redirect("/");
            }

            req.token = token;
            req.username = user.username;
            if (req.url === "/chat") return next();

            res.redirect("/chat");
        })
        .catch((error) => {
            if (req.url === "/chat") return res.redirect("/");

            next();
        });
};

module.exports = auth;
