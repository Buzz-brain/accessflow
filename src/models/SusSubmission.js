const mongoose = require('mongoose');

const susSubmissionSchema = new mongoose.Schema(
  {
    participantCode: { type: String, required: true, trim: true, index: true },
    ownerUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    responses: { type: [Number], required: true },
    questionScores: { type: [Number], required: true },
    totalSusScore: { type: Number, required: true, min: 0, max: 100 },
    submittedAt: { type: Date, required: true, default: Date.now }
  },
  { timestamps: true }
);

susSubmissionSchema.index({ submittedAt: -1 });
susSubmissionSchema.index({ ownerUserId: 1, submittedAt: -1 });

susSubmissionSchema.methods.toClientObject = function toClientObject() {
  return {
    id: this._id.toString(),
    participantCode: this.participantCode,
    responses: this.responses,
    questionScores: this.questionScores,
    totalSusScore: this.totalSusScore,
    submittedAt: this.submittedAt
  };
};

const SusSubmission = mongoose.model('SusSubmission', susSubmissionSchema);

module.exports = SusSubmission;
