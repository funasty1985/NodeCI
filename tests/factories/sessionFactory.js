const Buffer = require('safe-buffer').Buffer;
const Keyrip = require('keygrip');
const keys = require('../../config/keys');
const keygrip = new Keyrip([keys.cookieKey]);

// factory is used to create a resource and export it 
module.exports = (user) => {
    const sessionObject = {
        passport: {
            user: user._id.toString()  // _id in mongodb is a js object
        }
    };

    // mimicing the session string in cookie
    const session = Buffer.from(
        JSON.stringify(sessionObject)
    ).toString('base64');

    // mimicing the seesion.sig(signature) in cookie
    const sig = keygrip.sign('session=' + session);

    return { session, sig };
}