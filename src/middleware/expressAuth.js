const jwt = require("jsonwebtoken");
const User = require("../models/user");

const auth = async (req, res, next) => {
    try {
        const { token, tokenExpiry } = req.cookies;
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        const user = await User.findOne({ _id: decoded._id, "tokens.token": token });
        
        if (!user) throw new Error();

        if (tokenExpiry < Date.now()) {
            user.deleteTokens(token);
            return res.redirect("/");
        }


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
