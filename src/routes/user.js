const express = require("express");
const hbs = require("hbs");

// require the models
const User = require("../models/user");

//require the middleware
const auth = require("../middleware/expressAuth");

const router = express.Router();

router.get("/", auth, (req, res) => {
    res.render("index");
});

router.get("/chat", auth, (req, res) => {
    res.render("chat");
});

router.get("/signup", auth, (req, res) => {
    res.render("signup");
});

router.post("/signup", async (req, res) => {
    try {
        const newUser = new User(req.body);

        const token = await newUser.generateAuthToken();

        res.cookie("token", token, {
            httpOnly: true,
            secure: false,
        })
            .cookie("tokenExpiry", Date.now() + 2 * 24 * 3600 * 1000, {
                httpOnly: true,
            })
            .send({ username: newUser.username });
    } catch (error) {
        res.status(400).send({
            error: error.message,
        });
    }
});

router.get("/login", auth, (req, res) => {
    res.render("login");
});

router.post("/login", async (req, res) => {
    try {
        const user = await User.findByCredentials(req.body);
        const token = await user.generateAuthToken();
        res.cookie("token", token, {
            httpOnly: true,
        })
            .cookie("tokenExpiry", Date.now() + 2 * 24 * 3600 * 1000, {
                httpOnly: true,
            })
            .send({ username: user.username });
    } catch (error) {
        res.status(400).send({ error: error.message });
    }
});

module.exports = router;
