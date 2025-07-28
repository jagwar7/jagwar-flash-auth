const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true},
  email: { type: String, required: true, unique: true},
  password: {type: String},
  googleId: { type: String},
  role: { type: String, enum: ['user', 'admin'], default: 'user'},
  authType: { type: String, enum: ['local', 'google'], default: 'local'},
  resetPasswordToken: { type: String, default: null},
  resetPasswordExpires: { type: Date, default: null},
  twoFactorSecret: { type: String, default: null},
  createdAt: {type: Date, default: Date.now},
  resetPasswordToken: {type: String},
  resetPasswordExpires: {type: Date}
});

module.exports = mongoose.model('User', userSchema);
