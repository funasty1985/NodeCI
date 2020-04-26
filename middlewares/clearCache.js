const { clearHash } = require('../services/cache');

// Unlike nornal express middleware , 
// we want to run this one right after the Router handler is done. 
module.exports = async (req, res, next) => {
    await next(); // await until the Router handler finish its works

    clearHash(req.user.id);
}