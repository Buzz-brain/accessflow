const mongoose = require('mongoose');
const { ASSESSMENT_METHODS, DIMENSION_ORDER } = require('../constants');

const accessibilityCriterionSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    code: { type: String, required: true, unique: true, trim: true, uppercase: true },
    dimensionCode: { type: String, required: true, trim: true, uppercase: true, enum: DIMENSION_ORDER },
    description: { type: String, required: true, trim: true },
    assessmentInstructions: { type: String, required: true, trim: true },
    assessmentMethod: { type: String, required: true, enum: ASSESSMENT_METHODS },
    maximumScore: { type: Number, required: true, default: 100, immutable: true, min: 100, max: 100 },
    isActive: { type: Boolean, required: true, default: true }
  },
  { timestamps: true }
);

accessibilityCriterionSchema.index({ dimensionCode: 1, isActive: 1 });

accessibilityCriterionSchema.methods.toClientObject = function toClientObject() {
  return {
    id: this._id.toString(),
    name: this.name,
    code: this.code,
    dimensionCode: this.dimensionCode,
    description: this.description,
    assessmentInstructions: this.assessmentInstructions,
    assessmentMethod: this.assessmentMethod,
    maximumScore: this.maximumScore,
    isActive: this.isActive
  };
};

const AccessibilityCriterion = mongoose.model('AccessibilityCriterion', accessibilityCriterionSchema);

module.exports = AccessibilityCriterion;
