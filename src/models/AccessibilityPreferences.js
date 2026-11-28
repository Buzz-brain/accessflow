const mongoose = require('mongoose');
const { GESTURE_SENSITIVITY, ACCESSIBILITY_MODES } = require('../constants');

const accessibilityPreferencesSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    voiceGuidanceEnabled: { type: Boolean, required: true, default: true },
    financialAnnouncementsEnabled: { type: Boolean, required: true, default: true },
    voiceSpeed: { type: Number, required: true, default: 1, min: 0.5, max: 2 },
    vibrationEnabled: { type: Boolean, required: true, default: true },
    vibrationIntensity: { type: Number, required: true, default: 50, min: 0, max: 100 },
    gestureSensitivity: { type: String, required: true, enum: GESTURE_SENSITIVITY, default: 'medium' },
    privacyMode: { type: Boolean, required: true, default: false },
    highContrastEnabled: { type: Boolean, required: true, default: false },
    textScale: { type: Number, required: true, default: 1, min: 1, max: 2 },
    simplifiedNavigation: { type: Boolean, required: true, default: false },
    preferredAccessibilityMode: { type: String, required: true, enum: ACCESSIBILITY_MODES, default: 'balanced' }
  },
  { timestamps: true }
);

accessibilityPreferencesSchema.methods.toClientObject = function toClientObject() {
  return {
    voiceGuidanceEnabled: this.voiceGuidanceEnabled,
    financialAnnouncementsEnabled: this.financialAnnouncementsEnabled,
    voiceSpeed: this.voiceSpeed,
    vibrationEnabled: this.vibrationEnabled,
    vibrationIntensity: this.vibrationIntensity,
    gestureSensitivity: this.gestureSensitivity,
    privacyMode: this.privacyMode,
    highContrastEnabled: this.highContrastEnabled,
    textScale: this.textScale,
    simplifiedNavigation: this.simplifiedNavigation,
    preferredAccessibilityMode: this.preferredAccessibilityMode,
    updatedAt: this.updatedAt
  };
};

const AccessibilityPreferences = mongoose.model('AccessibilityPreferences', accessibilityPreferencesSchema);

module.exports = AccessibilityPreferences;
