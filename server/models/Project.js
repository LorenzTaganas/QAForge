const mongoose = require('mongoose')

const projectSchema = new mongoose.Schema(
  {
    name: { type: String, required: [true, 'Project name is required'], trim: true },
    key: {
      type: String,
      required: [true, 'Project key is required'],
      uppercase: true,
      trim: true,
      maxlength: 10,
    },
    description: { type: String, default: '', trim: true },
    status: {
      type: String,
      enum: ['Active', 'On Hold', 'Completed', 'Archived'],
      default: 'Active',
    },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  },
  { timestamps: true },
)

module.exports = mongoose.model('Project', projectSchema)