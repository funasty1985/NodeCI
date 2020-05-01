const mongoose = require('mongoose');
const { Schema } = mongoose;

const userSchema = new Schema({
  googleId: String,
  displayName: String
  // retrieved from google oauth flow
});

mongoose.model('User', userSchema);
