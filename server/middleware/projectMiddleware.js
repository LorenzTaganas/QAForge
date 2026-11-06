const resolveProject = (req, res, next) => {
  const headerKey = typeof req.get('X-Project-Key') === 'string' ? req.get('X-Project-Key').trim().toUpperCase() : ''
  const bodyKey = typeof req.body?.projectKey === 'string' ? req.body.projectKey.trim().toUpperCase() : ''
  const requested = headerKey || bodyKey

  if (requested) {
    if (!req.user.projects.includes(requested)) {
      return res.status(403).json({
        success: false,
        message: 'You are not a member of this project.',
      })
    }
    req.projectKey = requested
    return next()
  }

  const fallback = req.user.selectedProjectKey && req.user.projects.includes(req.user.selectedProjectKey)
    ? req.user.selectedProjectKey
    : req.user.projects[0] || null

  if (!fallback) {
    return res.status(403).json({
      success: false,
      message: 'You are not a member of any project yet. Ask an Admin to add you to one.',
    })
  }

  req.projectKey = fallback
  next()
}

const scopeProjects = (req, res, next) => {
  const requested = typeof req.query.projectKey === 'string' ? req.query.projectKey.trim().toUpperCase() : ''

  if (requested && !req.user.projects.includes(requested)) {
    return res.status(403).json({
      success: false,
      message: 'You are not a member of this project.',
    })
  }

  req.projectKeys = requested ? [requested] : req.user.projects
  next()
}

module.exports = { resolveProject, scopeProjects }
