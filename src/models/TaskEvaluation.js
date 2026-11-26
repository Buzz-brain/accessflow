const mongoose = require('mongoose');

const taskEvaluationSchema = new mongoose.Schema(
  {
    participantCode: { type: String, required: true, trim: true, index: true },
    ownerUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    taskId: { type: mongoose.Schema.Types.ObjectId, ref: 'EvaluationTask', required: true, index: true },
    startedAt: { type: Date, required: true, default: Date.now },
    completedAt: { type: Date, default: null },
    completionTimeSeconds: { type: Number, default: null, min: 0 },
    isSuccessful: { type: Boolean, default: null },
    errorCount: { type: Number, default: 0, min: 0 },
    assistanceRequired: { type: Boolean, default: false },
    notes: { type: String, default: '', trim: true },
    status: { type: String, enum: ['in_progress', 'completed'], required: true, default: 'in_progress' }
  },
  { timestamps: true }
);

taskEvaluationSchema.index({ taskId: 1, createdAt: -1 });
taskEvaluationSchema.index({ participantCode: 1, createdAt: -1 });
taskEvaluationSchema.index({ ownerUserId: 1, status: 1, createdAt: -1 });

taskEvaluationSchema.methods.toClientObject = function toClientObject() {
  return {
    id: this._id.toString(),
    participantCode: this.participantCode,
    taskId: this.taskId.toString(),
    startedAt: this.startedAt,
    completedAt: this.completedAt,
    completionTimeSeconds: this.completionTimeSeconds,
    isSuccessful: this.isSuccessful,
    errorCount: this.errorCount,
    assistanceRequired: this.assistanceRequired,
    notes: this.notes,
    status: this.status
  };
};

const TaskEvaluation = mongoose.model('TaskEvaluation', taskEvaluationSchema);

module.exports = TaskEvaluation;
