const mongoose = require('mongoose');

const evaluationTaskSchema = new mongoose.Schema(
  {
    taskName: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    taskCode: { type: String, required: true, unique: true, trim: true, uppercase: true },
    isActive: { type: Boolean, required: true, default: true }
  },
  { timestamps: true }
);

evaluationTaskSchema.methods.toClientObject = function toClientObject() {
  return {
    id: this._id.toString(),
    taskName: this.taskName,
    description: this.description,
    taskCode: this.taskCode,
    isActive: this.isActive
  };
};

const EvaluationTask = mongoose.model('EvaluationTask', evaluationTaskSchema);

module.exports = EvaluationTask;
