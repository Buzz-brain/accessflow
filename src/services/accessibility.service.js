const AccessibilityPreferences = require('../models/AccessibilityPreferences');
const User = require('../models/User');
const ApiError = require('../utils/ApiError');
const { allowedFields } = require('../validators/accessibility.validator');

const getOrCreatePreferences = async (userId) => {
  let preferences = await AccessibilityPreferences.findOne({ userId });

  if (!preferences) {
    try {
      preferences = await AccessibilityPreferences.create({ userId });
      await User.updateOne({ _id: userId }, { $set: { accessibilityPreferences: preferences._id } });
    } catch (error) {
      if (error.code !== 11000) throw error;
      preferences = await AccessibilityPreferences.findOne({ userId });
    }
  }

  if (!preferences) throw new ApiError(500, 'Accessibility preferences could not be loaded', 'CONFIGURATION_ERROR');
  return preferences;
};

const getPreferences = async (userId) => {
  const preferences = await getOrCreatePreferences(userId);
  return preferences.toClientObject();
};

const updatePreferences = async (userId, updates) => {
  const changes = {};
  for (const field of allowedFields) {
    if (Object.prototype.hasOwnProperty.call(updates, field)) changes[field] = updates[field];
  }
  if (Object.keys(changes).length === 0) throw ApiError.badRequest('No recognized accessibility preferences were provided');

  await getOrCreatePreferences(userId);

  const preferences = await AccessibilityPreferences.findOneAndUpdate(
    { userId },
    { $set: changes },
    { new: true, runValidators: true }
  );

  return preferences.toClientObject();
};

const resetPreferences = async (userId) => {
  await getOrCreatePreferences(userId);

  const blank = new AccessibilityPreferences({ userId });
  const defaults = {};
  for (const field of allowedFields) defaults[field] = blank[field];

  const preferences = await AccessibilityPreferences.findOneAndUpdate(
    { userId },
    { $set: defaults },
    { new: true, runValidators: true }
  );

  return preferences.toClientObject();
};

module.exports = { getPreferences, updatePreferences, resetPreferences, getOrCreatePreferences };
