const mongoose = require('mongoose')

const testRunSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true },
    title: { type: String, required: [true, 'Test run title is required'], trim: true },
    description: { type: String, default: '', trim: true },
    environment: {
      type: String,
      enum: ['Dev', 'Staging', 'Production'],
      default: 'Dev',
    },
    status: {
      type: String,
      enum: ['Not Started', 'In Progress', 'Blocked', 'Completed'],
      default: 'Not Started',
    },
    executedBy: { type: String, default: '', trim: true },
    startedAt: { type: Date },
    completedAt: { type: Date },
    project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
    testCases: [
      {
        testCase: { type: mongoose.Schema.Types.ObjectId, ref: 'TestCase', required: true },
        result: {
          type: String,
          enum: ['Pending', 'Passed', 'Failed', 'Skipped'],
          default: 'Pending',
        },
        note: { type: String, default: '', trim: true },
        executedAt: { type: Date },
      },
    ],
    labels: [{ type: String, trim: true }],
  },
  { timestamps: true },
)

module.exports = mongoose.model('TestRun', testRunSchema)