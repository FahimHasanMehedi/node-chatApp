const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        trim: true,
        required: true,
        unique: true,
    },
    email: {
        type: String,
        trim: true,
        required: true,
        unique: true,
    },
    password: {
        type: String,
        required: true,
        minLength: [6, "Password must contain minimum 6 characters!!!"],
    },
    tokens: [
        {
            token: {
                type: String,
            },
        },
    ],
});

userSchema.statics.findByCredentials = async ({ username, password }) => {
    const user = await User.findOne({ username });

    if (!user) {
        throw new Error("Unable to login!!!");
    }
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
        throw new Error("Unable to login!!!");
    }
    return user;
};

userSchema.methods.generateAuthToken = async function () {
    const token = await jwt.sign({ username: this.username }, "seethestonesetinyoureyes");

    this.tokens = this.tokens.concat({ token });

    return token;
};

userSchema.pre("save", async function (next) {
    this.password = await bcrypt.hash(this.password, 10);
    next();
});

//error handling middleware for saving a document
userSchema.post("save", function (error, doc, next) {
    if (error.name === "MongoServerError" && error.code === 11000) {
        next(new Error("Username and Email should be unique!!!"));
    } else {
        if (error.errors.password) throw new Error(error.errors.password.properties.message);
        next();
    }
});

const User = mongoose.model("User", userSchema);

module.exports = User;
