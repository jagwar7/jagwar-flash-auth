const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: function() { return this.isNew; } },
  email: { type: String, required: true, unique: true },
  password: {
    type: String,
    required: function () {
      return this.authType === "local";
    },
  },
  role: { type: String, enum: ["user", "admin"], default: "user" },
  authType: { type: String, enum: ["local", "google"], default: "local" },
  resetPasswordToken: { type: String, default: null },
  resetPasswordExpires: { type: Date, default: null },
  createdAt: { type: Date, default: Date.now },
});

module.exports = { userSchema };