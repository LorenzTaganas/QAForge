const mongoose = require('mongoose')

const bugSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true },
    title: { type: String, required: [true, 'Bug title is required'], trim: true },
    description: { type: String, default: '', trim: true },
    stepsToReproduce: { type: String, default: '', trim: true },
    expectedBehavior: { type: String, default: '', trim: true },
    actualBehavior: { type: String, default: '', trim: true },
    severity: {
      type: String,
      enum: ['Trivial', 'Minor', 'Major', 'Critical', 'Blocker'],
      default: 'Major',
    },
    priority: {
      type: String,
      enum: ['Low', 'Medium', 'High', 'Critical'],
      default: 'High',
    },
    status: {
      type: String,
      enum: ['Open', 'In Progress', 'Resolved', 'Verified', 'Closed', 'Won't Fix', 'Duplicate'],
      default: 'Open',
    },
    project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
    reporter: { type: String, required: true, trim: true },
    assignee: { type: String, default: '', trim: true },
    environment: { type: String, default: '', trim: true },
    labels: [{ type: String, trim: true }],
  },
  { timestamps: true },
)

module.exports = mongoose.model('Bug', bugSchema)