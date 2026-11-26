const mongoose = require('mongoose');
const { ROLES } = require('../constants');

const userSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    phoneNumber: { type: String, required: true, trim: true },
    passwordHash: { type: String, required: true, select: false },
    role: { type: String, enum: Object.values(ROLES), default: ROLES.USER },
    isActive: { type: Boolean, default: true },
    accessibilityPreferences: { type: mongoose.Schema.Types.ObjectId, ref: 'AccessibilityPreferences' },
    researchParticipantCode: {
      type: String,
      trim: true,
      unique: true,
      sparse: true,
      match: /^[A-Za-z0-9_-]{2,50}$/
    },
    lastLoginAt: { type: Date }
  },
  { timestamps: true }
);

userSchema.methods.toSafeObject = function toSafeObject() {
  return {
    id: this._id.toString(),
    fullName: this.fullName,
    email: this.email,
    phoneNumber: this.phoneNumber,
    role: this.role,
    isActive: this.isActive,
    createdAt: this.createdAt
  };
};

const User = mongoose.model('User', userSchema);

module.exports = User;
