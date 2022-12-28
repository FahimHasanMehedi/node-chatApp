const User = require("../models/user");

const cache = new Map();

const getUsersByToken = async function (id, token) {
    if (cache.has(id)) {
        return cache.get(id);
    }

    const resultPromise = User.findOne({ _id: id, 'tokens.token': token }).exec();
    cache.set(id, resultPromise);

    resultPromise.finally(() => {
        cache.delete(id);
    });

    return resultPromise;
};

module.exports = getUsersByToken;
