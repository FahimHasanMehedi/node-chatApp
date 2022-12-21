const User = require("../models/user");

const cache = new Map();

const getUsers = async function (username) {
    if (cache.has(username)) {
        return cache.get(username);
    }

    const resultPromise = User.findOne({ username }).exec();
    cache.set(username, resultPromise);

    resultPromise.finally(() => {
        cache.delete(username);
    });

    return resultPromise;
};

module.exports = getUsers;
