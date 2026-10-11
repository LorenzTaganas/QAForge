const mongoose = require('mongoose')
const bcrypt = require('bcryptjs')

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: [true, 'Name is required'], trim: true },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Enter a valid email address.'],
    },
    password: { type: String, required: [true, 'Password is required'], minlength: 6, select: false },
    role: {
      type: String,
      enum: ['QA Tester', 'QA Lead', 'Developer', 'Project Manager', 'Admin'],
      default: 'QA Tester',
    },
    avatar: { type: String, default: '' },
    projects: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Project' }],
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
)

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next()
  const salt = await bcrypt.genSalt(10)
  this.password = await bcrypt.hash(this.password, salt)
  next()
})

userSchema.methods.matchPassword = async function (enteredPassword) {
  return bcrypt.compare(enteredPassword, this.password)
}

userSchema.methods.toPublic = function () {
  return {
    id: this._id,
    name: this.name,
    email: this.email,
    role: this.role,
    avatar: this.avatar,
    projects: this.projects,
  }
}

module.exports = mongoose.model('User', userSchema)