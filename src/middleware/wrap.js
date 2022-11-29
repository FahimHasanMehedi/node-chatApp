const auth = require("./auth");

const wrap = (socket, next) => {
    console.log("wrap");
    auth(socket, {}, next);
};

module.exports = wrap;
