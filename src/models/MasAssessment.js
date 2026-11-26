const mongoose = require('mongoose');
const { ASSESSMENT_STATUSES, DIMENSION_ORDER, ASSESSMENT_METHODS } = require('../constants');

const criterionScoreSchema = new mongoose.Schema(
  {
    criterionId: { type: mongoose.Schema.Types.ObjectId, ref: 'AccessibilityCriterion', required: true },
    criterionCode: { type: String, required: true, uppercase: true },
    dimensionCode: { type: String, required: true, uppercase: true, enum: DIMENSION_ORDER },
    criterionName: { type: String, required: true },
    score: { type: Number, required: true, min: 0, max: 100 },
    evidence: { type: String, default: '', trim: true },
    assessedAt: { type: Date, default: Date.now },
    assessedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  },
  { _id: false }
);

const dimensionScoreSchema = new mongoose.Schema(
  {
    code: { type: String, required: true, enum: DIMENSION_ORDER },
    name: { type: String, required: true },
    score: { type: Number, default: null },
    weight: { type: Number, required: true },
    weightedContribution: { type: Number, default: null },
    assessedCount: { type: Number, required: true, default: 0 },
    criteriaCount: { type: Number, required: true, default: 0 }
  },
  { _id: false }
);

const weightsSchema = new mongoose.Schema(
  {
    P: { type: Number, required: true },
    O: { type: Number, required: true },
    C: { type: Number, required: true },
    S: { type: Number, required: true },
    A: { type: Number, required: true }
  },
  { _id: false }
);

const dimensionSummarySchema = new mongoose.Schema(
  {
    code: { type: String, required: true, enum: DIMENSION_ORDER },
    name: { type: String, required: true },
    score: { type: Number, required: true }
  },
  { _id: false }
);

const lowCriterionSchema = new mongoose.Schema(
  {
    code: { type: String, required: true },
    name: { type: String, required: true },
    dimensionCode: { type: String, required: true },
    score: { type: Number, required: true }
  },
  { _id: false }
);

const criterionSnapshotSchema = new mongoose.Schema(
  {
    criterionId: { type: mongoose.Schema.Types.ObjectId, ref: 'AccessibilityCriterion', required: true },
    code: { type: String, required: true, uppercase: true },
    name: { type: String, required: true },
    description: { type: String, required: true },
    dimensionCode: { type: String, required: true, uppercase: true, enum: DIMENSION_ORDER },
    assessmentInstructions: { type: String, required: true },
    assessmentMethod: { type: String, required: true, enum: ASSESSMENT_METHODS },
    maximumScore: { type: Number, required: true, default: 100, min: 100, max: 100 },
    isActive: { type: Boolean, required: true, default: true },
    order: { type: Number, required: true, default: 0 }
  },
  { _id: false }
);

const dimensionSnapshotSchema = new mongoose.Schema(
  {
    code: { type: String, required: true, uppercase: true, enum: DIMENSION_ORDER },
    name: { type: String, required: true },
    description: { type: String, required: true },
    weight: { type: Number, required: true },
    isActive: { type: Boolean, required: true, default: true },
    order: { type: Number, required: true, default: 0 }
  },
  { _id: false }
);

const masAssessmentSchema = new mongoose.Schema(
  {
    assessmentName: { type: String, required: true, trim: true },
    assessedVersion: { type: String, required: true, trim: true },
    criteriaSnapshot: { type: [criterionSnapshotSchema], default: [] },
    dimensionsSnapshot: { type: [dimensionSnapshotSchema], default: [] },
    criterionScores: { type: [criterionScoreSchema], default: [] },
    dimensionScores: { type: [dimensionScoreSchema], default: [] },
    weightsUsed: { type: weightsSchema, required: true },
    overallMAS: { type: Number, default: null },
    assessmentStatus: { type: String, enum: Object.values(ASSESSMENT_STATUSES), required: true, default: ASSESSMENT_STATUSES.DRAFT },
    assessorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    assessmentNotes: { type: String, trim: true, default: '' },
    highestDimension: { type: dimensionSummarySchema, default: null },
    lowestDimension: { type: dimensionSummarySchema, default: null },
    lowScoringCriteria: { type: [lowCriterionSchema], default: [] },
    missingCriteria: { type: [String], default: [] },
    scoredCriteriaCount: { type: Number, required: true, default: 0 },
    requiredCriteriaCount: { type: Number, required: true, default: 0 },
    isComplete: { type: Boolean, required: true, default: false },
    completedAt: { type: Date, default: null }
  },
  { timestamps: true }
);

masAssessmentSchema.index({ createdAt: -1 });
masAssessmentSchema.index({ assessmentStatus: 1, createdAt: -1 });

masAssessmentSchema.methods.toClientObject = function toClientObject() {
  return {
    id: this._id.toString(),
    assessmentName: this.assessmentName,
    assessedVersion: this.assessedVersion,
    criteriaSnapshot: this.criteriaSnapshot,
    dimensionsSnapshot: this.dimensionsSnapshot,
    criterionScores: this.criterionScores,
    dimensionScores: this.dimensionScores,
    weightsUsed: this.weightsUsed,
    overallMAS: this.overallMAS,
    assessmentStatus: this.assessmentStatus,
    assessorId: this.assessorId ? this.assessorId.toString() : null,
    assessmentNotes: this.assessmentNotes,
    highestDimension: this.highestDimension,
    lowestDimension: this.lowestDimension,
    lowScoringCriteria: this.lowScoringCriteria,
    missingCriteria: this.missingCriteria,
    scoredCriteriaCount: this.scoredCriteriaCount,
    requiredCriteriaCount: this.requiredCriteriaCount,
    isComplete: this.isComplete,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt,
    completedAt: this.completedAt
  };
};

const MasAssessment = mongoose.model('MasAssessment', masAssessmentSchema);

module.exports = MasAssessment;
