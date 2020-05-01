const mongoose = require('mongoose');
const User = mongoose.model('User');

// create an user , save it to mongodb and return it
module.exports = () => {
    return new User({}).save();  // an promise object
};