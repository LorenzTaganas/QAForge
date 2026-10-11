const mongoose = require('mongoose')

const stepSchema = new mongoose.Schema(
  {
    action: { type: String, required: true, trim: true },
    expected: { type: String, required: true, trim: true },
  },
  { _id: false },
)

const testCaseSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true },
    title: { type: String, required: [true, 'Test case title is required'], trim: true },
    description: { type: String, default: '', trim: true },
    type: {
      type: String,
      enum: ['Functional', 'Regression', 'Smoke', 'Security', 'Performance', 'Integration'],
      default: 'Functional',
    },
    priority: {
      type: String,
      enum: ['Low', 'Medium', 'High', 'Critical'],
      default: 'Medium',
    },
    status: {
      type: String,
      enum: ['Draft', 'Ready', 'In Progress', 'Deprecated'],
      default: 'Draft',
    },
    steps: [stepSchema],
    preconditions: { type: String, default: '', trim: true },
    postconditions: { type: String, default: '', trim: true },
    project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
    requirement: { type: mongoose.Schema.Types.ObjectId, ref: 'Requirement' },
    labels: [{ type: String, trim: true }],
    owner: { type: String, required: true, trim: true },
  },
  { timestamps: true },
)

module.exports = mongoose.model('TestCase', testCaseSchema)