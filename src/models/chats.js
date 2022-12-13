const mongoose = require("mongoose");

const chatSchema = new mongoose.Schema({
    message: {
        type: String,
        required: true,
    },
    sender: {
        type: String,
        required: true,
    },
    receiver: {
        type: String,
        required: true,
    },
    roomname: {
        type: String,
        required: true,
    },
});

const Chat = mongoose.model("Chat", chatSchema);

module.exports = Chat;
