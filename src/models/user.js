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
    friends: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    requests: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    inbox: [
        {
            friendUsername: {
                type: String,
            },
            friendId: {
                type: mongoose.Schema.Types.ObjectId,
            },
            lastMessage: {
                type: String,
            },
            messageId: {
                type: mongoose.Schema.Types.ObjectId,
            },
            sender: {
                type: String,
            },
        },
    ],
    tokens: [
        {
            token: {
                type: String,
            },
        },
    ],
});

userSchema.set("toJSON", { virtuals: true });
userSchema.set("toObject", { virtuals: true });

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

userSchema.statics.findByToken = async (token) => {
    const user = await User.findOne({ token });

    if (!user) throw new Error("Unable to find user");

    return user;
};

userSchema.methods.generateAuthToken = async function () {
    const token = jwt.sign({ _id: this._id.toString() }, "seethestonesetinyoureyes");

    this.tokens = this.tokens.concat({ token });

    await this.save();

    return token;
};

userSchema.methods.addFriend = async function (friendUsername) {
    const friend = await User.findOne({ username: friendUsername }, { _id: 1, friends: 1 });

    this.friends = this.friends.concat(friend._id);
    friend.friends = friend.friends.concat(this._id);
    await this.save();
    await friend.save();
};

userSchema.methods.getFriends = async function () {
    await this.populate("friends");
    return this.friends;
};

userSchema.methods.addRequest = async function (id) {
    this.requests = this.requests.concat(id);
    await this.save();

    return this;
};

userSchema.methods.deleteRequest = async function (username) {
    const id = await User.findOne({ username }, { _id: 1 });
    this.requests = this.requests.filter((request) => !id._id.equals(request));
    await this.save();
};

userSchema.methods.getRequests = async function () {
    await this.populate("requests");
    return this.requests;
};

userSchema.pre("save", async function (next) {
    if (this.isModified("password")) {
        this.password = await bcrypt.hash(this.password, 10);
    }
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
