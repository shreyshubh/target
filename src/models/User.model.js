const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const config = require('../config');

const UserSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      minlength: 3,
      maxlength: 30,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      match: [config.EMAIL_REGEX, 'Please use a valid email from a recognized provider'],
    },
    passwordHash: { type: String, required: true },
    resetCode: { type: String, default: null },
    resetCodeExpiry: { type: Date, default: null },
    resetAttempts: { type: Number, default: 0 },
    resetAttemptsExpiry: { type: Date, default: null },
  },
  { timestamps: true }
);

// Hash password before saving
UserSchema.pre('save', async function () {
  if (!this.isModified('passwordHash')) return;
  const salt = await bcrypt.genSalt(12);
  this.passwordHash = await bcrypt.hash(this.passwordHash, salt);
});

// Compare password
UserSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.passwordHash);
};

module.exports = mongoose.model('User', UserSchema);
