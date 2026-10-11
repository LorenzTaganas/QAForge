const mongoose = require('mongoose')

const requirementSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true },
    title: { type: String, required: [true, 'Requirement title is required'], trim: true },
    description: { type: String, default: '', trim: true },
    acceptanceCriteria: { type: String, default: '', trim: true },
    owner: { type: String, required: true, trim: true },
    priority: {
      type: String,
      enum: ['Low', 'Medium', 'High', 'Critical'],
      default: 'Medium',
    },
    status: {
      type: String,
      enum: ['Draft', 'In Review', 'Approved', 'Implemented', 'Rejected'],
      default: 'Draft',
    },
    project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
    labels: [{ type: String, trim: true }],
  },
  { timestamps: true },
)

module.exports = mongoose.model('Requirement', requirementSchema)