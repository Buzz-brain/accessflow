const mongoose = require('mongoose');
const { DIMENSION_ORDER } = require('../constants');

const accessibilityDimensionSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    code: { type: String, required: true, unique: true, trim: true, uppercase: true, enum: DIMENSION_ORDER },
    description: { type: String, required: true, trim: true },
    weight: { type: Number, required: true, min: 0, max: 1 },
    criteria: [{ type: mongoose.Schema.Types.ObjectId, ref: 'AccessibilityCriterion' }],
    isActive: { type: Boolean, required: true, default: true }
  },
  { timestamps: true }
);

accessibilityDimensionSchema.methods.toClientObject = function toClientObject(criteria = []) {
  return {
    id: this._id.toString(),
    name: this.name,
    code: this.code,
    description: this.description,
    weight: this.weight,
    isActive: this.isActive,
    criteriaCount: criteria.length
  };
};

const AccessibilityDimension = mongoose.model('AccessibilityDimension', accessibilityDimensionSchema);

module.exports = AccessibilityDimension;
