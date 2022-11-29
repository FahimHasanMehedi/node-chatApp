const express = require("express");

// require the models
const User = require("../models/user");

//require the middleware
const auth = require("../middleware/auth");

const router = express.Router();

router.post("/", (req, res) => {
    res.clearCookie("io");
    res.end();
});

router.post("/signup", async (req, res) => {
    try {
        const newUser = new User(req.body);

        const token = await newUser.generateAuthToken();

        res.cookie("token", token, {
            httpOnly: true,
            secure: false,
        }).send({
            newUser,
            token,
        });
    } catch (error) {
        res.status(400).send({
            error: error.message,
        });
    }
});

router.post("/login", auth, async (req, res) => {
    try {
        const user = await User.findByCredentials(req.body);
        const token = await user.generateAuthToken();
        res.cookie("token", token, {
            httpOnly: true,
        }).send({ user, token });
    } catch (error) {
        res.status(400).send({ error: error.message });
    }
});

module.exports = router;
