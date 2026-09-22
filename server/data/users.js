const bcrypt = require('bcryptjs')

const users = [
  {
    id: 'usr-qa-001',
    name: 'Lorenz Taganas',
    email: 'qa@qaforge.local',
    password: bcrypt.hashSync('password123', 10),
    role: 'QA Tester',
    projects: ['proj-pp-001'],
  },
  {
    id: 'usr-lead-001',
    name: 'Maria Santos',
    email: 'lead@qaforge.local',
    password: bcrypt.hashSync('password123', 10),
    role: 'QA Lead',
    projects: ['proj-pp-001'],
  },
  {
    id: 'usr-dev-001',
    name: 'John Cruz',
    email: 'developer@qaforge.local',
    password: bcrypt.hashSync('password123', 10),
    role: 'Developer',
    projects: ['proj-pp-001'],
  },
  {
    id: 'usr-pm-001',
    name: 'Mark Reyes',
    email: 'manager@qaforge.local',
    password: bcrypt.hashSync('password123', 10),
    role: 'Project Manager',
    projects: ['proj-pp-001'],
  },
]

module.exports = users
