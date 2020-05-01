require('../models/User');

const monogoose = require('mongoose');
const keys = require('../config/keys');

// tell mongoose to use nodejs global Promise object
monogoose.Promise = global.Promise;
monogoose.connect(keys.mongoURI, {useNewUrlParser: true});

jest.setTimeout(20000);
